import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { ApiEndpoints } from '../../../../core/constants/api-endpoints';
import { AuthTokenService } from '../../../../core/services/auth-token.service';
import { CartService } from '../../../../core/services/cart.service';
import { AppLang, LanguageService } from '../../../../core/services/language.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { AuthApiService } from '../../services/auth-api.service';
import { abpErrorMessage, parseTokenAuthEnvelopeDetailed } from '../../utils/auth-abp.util';
import { resultFromAbpEnvelope } from '../../../../core/utils/api-envelope.util';

function passwordsMatch(control: AbstractControl): { mismatch: true } | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  if (password && confirm && password !== confirm) {
    return { mismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly tokens = inject(AuthTokenService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly cart = inject(CartService);
  private readonly tenants = inject(TenantService);

  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      birthDate: [''],
      gender: [''],
    },
    { validators: passwordsMatch },
  );

  setLang(lang: AppLang): void {
    void this.language.useLanguage(lang);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.loading.set(true);
    const sessionId = this.cart.getGuestSessionId();
    const hasGuestCart = this.cart.hasGuestCart();
    const tenantId = this.tenants.tenantId();

    this.authApi
      .register({
        fullName: raw.fullName,
        email: raw.email,
        mobile: raw.mobile,
        password: raw.password,
        birthDate: raw.birthDate || null,
        gender: raw.gender || null,
      }, sessionId)
      .pipe(
        switchMap((registerRes) => {
          const email = raw.email.trim().toLowerCase();
          const parsed = parseTokenAuthEnvelopeDetailed(registerRes, email);
          if (parsed) {
            this.tokens.saveLoginData(parsed.loginData, true);
            this.tokens.saveCustomerId(parsed.customerId, true);
            this.cart.refresh();
            return of(null);
          }
          return this.authApi.authenticate({
            userNameOrEmailAddress: email,
            password: raw.password,
            tenantId: tenantId ?? undefined,
            hostManager: false,
            rememberClient: true,
          });
        }),
        switchMap((authRes) => {
          // If we already got token from register response, nothing else to do.
          if (!authRes) {
            return of(null);
          }
          const email = raw.email.trim().toLowerCase();
          const parsed = parseTokenAuthEnvelopeDetailed(authRes, email);
          if (!parsed) {
            return of(null);
          }
          this.tokens.saveLoginData(parsed.loginData, true);
          // Authenticate doesn't return customer -> load profile.
          return this.authApi.getECommerceCustomerProfile().pipe(
            switchMap((profileRes) => {
              const profile = resultFromAbpEnvelope<{ id?: number }>(profileRes);
              const customerId = profile?.id != null ? String(profile.id) : null;
              this.tokens.saveCustomerId(customerId, true);
              if (customerId && sessionId && hasGuestCart) {
                return this.authApi.mergeGuestCart(customerId, sessionId);
              }
              return of(null);
            }),
          );
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (authRes) => {
          const email = raw.email.trim().toLowerCase();
          if (authRes && typeof authRes === 'object') {
            const parsed = parseTokenAuthEnvelopeDetailed(authRes, email);
            if (parsed) {
              this.tokens.saveLoginData(parsed.loginData, true);
              this.tokens.saveCustomerId(parsed.customerId, true);
              this.toastr.success(this.translate.instant('AUTH.REGISTER_SUCCESS'));
              this.cart.refresh();
              void this.router.navigateByUrl(ApiEndpoints.postLoginUrl);
              return;
            }
          }
          // Token may have been returned in register response (handled above) or no token at all.
          this.toastr.success(this.translate.instant('AUTH.REGISTER_SUCCESS'));
          this.cart.refresh();
          if (hasGuestCart) {
            this.cart.clearGuestCart();
          }
          void this.router.navigateByUrl(ApiEndpoints.postLoginUrl);
        },
        error: (err) => {
          this.toastr.error(
            abpErrorMessage(err, this.translate.instant('AUTH.REGISTER_FAILED')),
          );
        },
      });
  }
}
