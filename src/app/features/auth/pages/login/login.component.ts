import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import { ApiEndpoints } from '../../../../core/constants/api-endpoints';
import { AuthTokenService } from '../../../../core/services/auth-token.service';
import { AppLang, LanguageService } from '../../../../core/services/language.service';
import { AuthApiService } from '../../services/auth-api.service';
import { parseLoginEnvelope } from '../../utils/login-response.util';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, TranslateModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly auth = inject(AuthTokenService);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly language = inject(LanguageService);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);

  protected username = '';
  protected password = '';
  protected rememberMe = false;
  protected submitting = false;

  protected setLang(lang: AppLang): void {
    void this.language.useLanguage(lang);
  }

  protected submit(): void {
    const userName = this.username.trim();
    if (!userName || !this.password || this.submitting) {
      return;
    }

    this.submitting = true;
    this.authApi
      .login({ userName, password: this.password })
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (res) => {
          const { data, message } = parseLoginEnvelope(res);
          if (!data) {
            this.toastr.error(message ?? this.translate.instant('AUTH.LOGIN_FAILED'));
            return;
          }

          this.auth.saveLoginData(data, this.rememberMe);
          this.toastr.success(
            this.translate.instant('AUTH.LOGIN_SUCCESS'),
            this.translate.instant('TOAST.SUCCESS'),
          );
          this.navigateAfterLogin();
        },
        error: () => {
          this.toastr.error(
            this.translate.instant('AUTH.LOGIN_FAILED'),
            this.translate.instant('TOAST.ERROR'),
          );
        },
      });
  }

  private navigateAfterLogin(): void {
    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') || ApiEndpoints.postLoginUrl;
    void this.router.navigateByUrl(returnUrl);
  }
}
