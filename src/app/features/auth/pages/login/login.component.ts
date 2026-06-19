import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

import { ApiEndpoints } from '../../../../core/constants/api-endpoints';
import { AuthTokenService } from '../../../../core/services/auth-token.service';
import { CartService } from '../../../../core/services/cart.service';
import { AppLang, LanguageService } from '../../../../core/services/language.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { AuthApiService } from '../../services/auth-api.service';
import { abpErrorMessage, parseTokenAuthEnvelopeDetailed } from '../../utils/auth-abp.util';
import { resultFromAbpEnvelope } from '../../../../core/utils/api-envelope.util';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly tokens = inject(AuthTokenService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly cart = inject(CartService);
  private readonly tenants = inject(TenantService);

  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    userNameOrEmailAddress: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [true],
  });

  setLang(lang: AppLang): void {
    void this.language.useLanguage(lang);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { userNameOrEmailAddress, password, rememberMe } = this.form.getRawValue();
    const hasGuestCart = this.cart.hasGuestCart();
    const tenantId = this.tenants.tenantId();
    this.loading.set(true);

    this.authApi
      .authenticate({
        userNameOrEmailAddress: userNameOrEmailAddress.trim().toLowerCase(),
        password,
        tenantId: tenantId ?? undefined,
        hostManager: false,
        rememberClient: rememberMe,
      })
      .pipe(
        switchMap((res) => {
          const parsed = parseTokenAuthEnvelopeDetailed(
            res,
            userNameOrEmailAddress.trim().toLowerCase(),
          );
          if (!parsed) {
            this.toastr.error(this.translate.instant('AUTH.LOGIN_FAILED'));
            return of(null);
          }
          this.tokens.saveLoginData(parsed.loginData, rememberMe);
          this.tokens.saveCustomerId(parsed.customerId, rememberMe);

          // Load profile (to resolve commerce customer id) if missing.
          if (!parsed.customerId) {
            return this.authApi.getECommerceCustomerProfile().pipe(
              switchMap((profileRes) => {
                const profile = resultFromAbpEnvelope<{ id?: number }>(profileRes);
                const customerId = profile?.id != null ? String(profile.id) : null;
                this.tokens.saveCustomerId(customerId, rememberMe);
                return of(customerId);
              }),
            );
          }
          return of(parsed.customerId);
        }),
        switchMap((customerId) => {
          if (!customerId || !hasGuestCart) {
            return of(null);
          }
          return this.cart.syncGuestCartToServer();
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: () => {
          this.toastr.success(this.translate.instant('AUTH.LOGIN_SUCCESS'));
          this.cart.refresh();
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          const target =
            returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('/auth')
              ? returnUrl
              : ApiEndpoints.postLoginUrl;
          void this.router.navigateByUrl(target);
        },
        error: (err) => {
          this.toastr.error(
            abpErrorMessage(err, this.translate.instant('AUTH.LOGIN_FAILED')),
          );
        },
      });
  }
}
