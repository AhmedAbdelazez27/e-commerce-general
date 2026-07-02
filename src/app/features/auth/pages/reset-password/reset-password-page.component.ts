import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

import { TenantService } from '../../../../core/services/tenant.service';
import { AuthPageHeaderComponent } from '../../components/auth-page-header/auth-page-header.component';
import { AuthApiService } from '../../services/auth-api.service';
import { abpErrorMessage, abpRequestSucceeded } from '../../utils/auth-abp.util';
import { passwordsMatch, passwordInputType } from '../../utils/password-form.util';

@Component({
  selector: 'app-reset-password-page',
  imports: [ReactiveFormsModule, RouterLink, TranslateModule, AuthPageHeaderComponent],
  templateUrl: './reset-password-page.component.html',
})
export class ResetPasswordPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly tenants = inject(TenantService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(false);
  readonly invalidLink = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly passwordInputType = passwordInputType;

  private email = '';
  private resetToken = '';
  private tenantId = 0;

  readonly form = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.email = (params.get('email') ?? params.get('Email') ?? '').trim().toLowerCase();
    this.resetToken =
      params.get('resetToken') ??
      params.get('ResetToken') ??
      params.get('token') ??
      params.get('c') ??
      '';

    const tenantFromLink = params.get('TenantId') ?? params.get('tenantId');
    const parsedTenant = tenantFromLink != null ? Number(tenantFromLink) : NaN;
    this.tenantId =
      Number.isFinite(parsedTenant) && parsedTenant >= 0
        ? parsedTenant
        : (this.tenants.tenantId() ?? 0);

    if (!this.email || !this.resetToken) {
      this.invalidLink.set(true);
    }
  }

  togglePasswordVisibility(field: 'new' | 'confirm'): void {
    if (field === 'new') {
      this.showNewPassword.update((visible) => !visible);
      return;
    }
    this.showConfirmPassword.update((visible) => !visible);
  }

  passwordToggleLabel(visible: boolean): string {
    return this.translate.instant(visible ? 'COMMON.HIDE_PASSWORD' : 'COMMON.SHOW_PASSWORD');
  }

  submit(): void {
    if (this.invalidLink() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { newPassword } = this.form.getRawValue();
    this.loading.set(true);

    this.authApi
      .postForgetPassword({
        email: this.email,
        resetToken: this.resetToken,
        newPassword,
        tenantId: this.tenantId,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (!abpRequestSucceeded(res)) {
            this.toastr.error(this.translate.instant('AUTH.RESET_PASSWORD_FAILED'));
            return;
          }
          this.toastr.success(this.translate.instant('AUTH.RESET_PASSWORD_SUCCESS'));
          void this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.toastr.error(
            abpErrorMessage(err, this.translate.instant('AUTH.RESET_PASSWORD_FAILED')),
          );
        },
      });
  }
}
