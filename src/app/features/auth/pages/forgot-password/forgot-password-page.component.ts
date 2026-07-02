import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

import { TenantService } from '../../../../core/services/tenant.service';
import { AuthPageHeaderComponent } from '../../components/auth-page-header/auth-page-header.component';
import { AuthApiService } from '../../services/auth-api.service';
import { abpErrorMessage, abpRequestSucceeded } from '../../utils/auth-abp.util';

@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, TranslateModule, AuthPageHeaderComponent],
  templateUrl: './forgot-password-page.component.html',
})
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly tenants = inject(TenantService);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(false);
  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.controls.email.value.trim().toLowerCase();
    const tenantId = this.tenants.tenantId() ?? 0;
    this.loading.set(true);

    this.authApi
      .forgetPassword({ email, tenantId })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (!abpRequestSucceeded(res)) {
            this.toastr.error(this.translate.instant('AUTH.FORGOT_PASSWORD_FAILED'));
            return;
          }
          this.submitted.set(true);
          this.toastr.success(this.translate.instant('AUTH.FORGOT_PASSWORD_SUCCESS'));
        },
        error: (err) => {
          this.toastr.error(
            abpErrorMessage(err, this.translate.instant('AUTH.FORGOT_PASSWORD_FAILED')),
          );
        },
      });
  }
}
