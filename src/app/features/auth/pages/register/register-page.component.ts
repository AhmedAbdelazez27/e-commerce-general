import {
  Component,
  DestroyRef,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { ApiEndpoints } from '../../../../core/constants/api-endpoints';
import { AuthTokenService } from '../../../../core/services/auth-token.service';
import { CartService } from '../../../../core/services/cart.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { resultFromAbpEnvelope, abpEnvelopeErrorMessage } from '../../../../core/utils/api-envelope.util';
import { AuthPageHeaderComponent } from '../../components/auth-page-header/auth-page-header.component';
import { OtpCodeInputComponent } from '../../components/otp-code-input/otp-code-input.component';
import {
  SendRegistrationOtpResult,
  VerifyRegistrationOtpResult,
} from '../../models/register.models';
import { AuthApiService } from '../../services/auth-api.service';
import { abpErrorMessage, abpRequestSucceeded, parseTokenAuthEnvelopeDetailed } from '../../utils/auth-abp.util';
import { passwordsMatch, passwordInputType } from '../../utils/password-form.util';
import { GENDER_OPTIONS } from '../../../account/config/account.config';
import { resolveAuthContinueUrl } from '../../utils/auth-navigation.util';

type RegisterStep = 'form' | 'otp';

const EMAIL_ALREADY_REGISTERED = 'Email is already registered.';

@Component({
  selector: 'app-register-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    AuthPageHeaderComponent,
    OtpCodeInputComponent,
  ],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
})
export class RegisterPageComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly tokens = inject(AuthTokenService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);
  private readonly cart = inject(CartService);
  private readonly tenants = inject(TenantService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly otpInput = viewChild(OtpCodeInputComponent);

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly passwordInputType = passwordInputType;
  readonly genderOptions = GENDER_OPTIONS;

  readonly step = signal<RegisterStep>('form');
  readonly maskedEmail = signal('');
  readonly otpCode = signal('');
  readonly otpError = signal('');
  readonly emailAlreadyRegistered = signal(false);
  readonly resendSecondsLeft = signal(0);
  readonly otpExpiresInSeconds = signal(0);

  readonly isOtpExpired = computed(() => this.otpExpiresInSeconds() <= 0 && this.step() === 'otp');
  readonly otpExpiryLabel = computed(() => {
    const total = Math.max(0, this.otpExpiresInSeconds());
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  });
  readonly otpValid = computed(() => /^\d{6}$/.test(this.otpCode()));

  private resendTimer: ReturnType<typeof setInterval> | null = null;
  private otpExpiryTimer: ReturnType<typeof setInterval> | null = null;

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

  constructor() {
    this.destroyRef.onDestroy(() => this.clearAllOtpTimers());
  }

  ngOnDestroy(): void {
    this.clearAllOtpTimers();
  }

  continueUrl(): string {
    return resolveAuthContinueUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
  }

  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showPassword.update((visible) => !visible);
      return;
    }
    this.showConfirmPassword.update((visible) => !visible);
  }

  passwordToggleLabel(visible: boolean): string {
    return this.translate.instant(visible ? 'COMMON.HIDE_PASSWORD' : 'COMMON.SHOW_PASSWORD');
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.emailAlreadyRegistered.set(false);
    this.otpError.set('');
    this.sendOtp(false);
  }

  onOtpCodeChange(code: string): void {
    this.otpCode.set(code);
    if (this.otpError()) {
      this.otpError.set('');
    }
  }

  verifyOtp(): void {
    this.otpError.set('');

    if (this.isOtpExpired()) {
      this.otpError.set(this.translate.instant('AUTH.OTP_EXPIRED'));
      return;
    }
    if (!this.otpValid()) {
      this.otpError.set(this.translate.instant('AUTH.OTP_REQUIRED'));
      return;
    }

    const raw = this.form.getRawValue();
    const email = raw.email.trim().toLowerCase();
    const otp = this.otpCode();
    this.loading.set(true);

    this.authApi
      .verifyRegistrationOtp(email, otp)
      .pipe(
        switchMap((verifyRes) => {
          if (!abpRequestSucceeded(verifyRes)) {
            const msg =
              abpEnvelopeErrorMessage(verifyRes) ||
              this.translate.instant('AUTH.OTP_VERIFY_FAILED');
            throw { kind: 'otp', message: msg };
          }
          const result = resultFromAbpEnvelope<VerifyRegistrationOtpResult>(verifyRes);
          const verificationToken = result?.verificationToken?.trim();
          if (!verificationToken) {
            throw {
              kind: 'otp',
              message: this.translate.instant('AUTH.OTP_VERIFY_FAILED'),
            };
          }
          return this.completeRegistration(verificationToken);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: () => {
          this.clearAllOtpTimers();
          this.toastr.success(this.translate.instant('AUTH.REGISTER_SUCCESS'));
          this.cart.refresh();
          void this.router.navigateByUrl(ApiEndpoints.postLoginUrl);
        },
        error: (err) => {
          if (err?.kind === 'otp') {
            this.otpError.set(err.message);
            this.otpInput()?.reset();
            this.otpCode.set('');
            return;
          }
          const message = abpErrorMessage(
            err,
            this.translate.instant('AUTH.REGISTER_FAILED'),
          );
          if (this.isAlreadyRegisteredMessage(message)) {
            this.emailAlreadyRegistered.set(true);
            this.backToForm();
            this.toastr.error(this.translate.instant('AUTH.EMAIL_ALREADY_REGISTERED'));
            return;
          }
          this.otpError.set(message);
          this.otpInput()?.reset();
          this.otpCode.set('');
        },
      });
  }

  resendOtp(): void {
    if (this.loading() || this.resendSecondsLeft() > 0) {
      return;
    }
    this.otpError.set('');
    this.sendOtp(true);
  }

  backToForm(): void {
    this.clearAllOtpTimers();
    this.step.set('form');
    this.otpCode.set('');
    this.otpError.set('');
    this.maskedEmail.set('');
  }

  private sendOtp(isResend: boolean): void {
    const email = this.form.controls.email.value.trim().toLowerCase();
    this.loading.set(true);

    this.authApi
      .sendRegistrationOtp(email)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (!abpRequestSucceeded(res)) {
            const message =
              abpEnvelopeErrorMessage(res) ||
              this.translate.instant('AUTH.OTP_SEND_FAILED');
            this.handleSendOtpFailure(message);
            return;
          }
          const result = resultFromAbpEnvelope<SendRegistrationOtpResult>(res);
          if (!result) {
            this.toastr.error(this.translate.instant('AUTH.OTP_SEND_FAILED'));
            return;
          }
          this.maskedEmail.set(result.maskedEmail || email);
          this.emailAlreadyRegistered.set(false);
          this.startOtpExpiry(result.expiresInSeconds || 300);
          this.startResendCooldown(result.resendAfterSeconds || 60);
          this.step.set('otp');
          if (isResend) {
            this.otpInput()?.reset();
            this.otpCode.set('');
            this.toastr.success(this.translate.instant('AUTH.OTP_RESEND'));
          }
        },
        error: (err) => {
          const message = abpErrorMessage(
            err,
            this.translate.instant('AUTH.OTP_SEND_FAILED'),
          );
          this.handleSendOtpFailure(message);
        },
      });
  }

  private handleSendOtpFailure(message: string): void {
    if (this.isAlreadyRegisteredMessage(message)) {
      this.emailAlreadyRegistered.set(true);
      this.step.set('form');
      this.toastr.error(this.translate.instant('AUTH.EMAIL_ALREADY_REGISTERED'));
      return;
    }
    if (this.step() === 'otp') {
      this.otpError.set(message);
    } else {
      this.toastr.error(message);
    }
  }

  private isAlreadyRegisteredMessage(message: string): boolean {
    return message.trim().toLowerCase().includes(EMAIL_ALREADY_REGISTERED.toLowerCase());
  }

  private completeRegistration(verificationToken: string) {
    const raw = this.form.getRawValue();
    const hasGuestCart = this.cart.hasGuestCart();
    const tenantId = this.tenants.tenantId();
    const email = raw.email.trim().toLowerCase();

    return this.authApi
      .register(
        {
          fullName: raw.fullName,
          email: raw.email,
          mobile: raw.mobile,
          password: raw.password,
          birthDate: raw.birthDate || null,
          gender: raw.gender || null,
        },
        null,
        verificationToken,
      )
      .pipe(
        switchMap((registerRes) => {
          const parsed = parseTokenAuthEnvelopeDetailed(registerRes, email);
          if (parsed) {
            this.tokens.saveLoginData(parsed.loginData, true);
            this.tokens.saveCustomerId(parsed.customerId, true);
            if (hasGuestCart && parsed.customerId) {
              return this.cart.syncGuestCartToServer();
            }
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
          if (!authRes) {
            return of(null);
          }
          const parsed = parseTokenAuthEnvelopeDetailed(authRes, email);
          if (!parsed) {
            return of(null);
          }
          this.tokens.saveLoginData(parsed.loginData, true);
          return this.authApi.getECommerceCustomerProfile().pipe(
            switchMap((profileRes) => {
              const profile = resultFromAbpEnvelope<{ id?: number }>(profileRes);
              const customerId = profile?.id != null ? String(profile.id) : null;
              this.tokens.saveCustomerId(customerId, true);
              if (customerId && hasGuestCart) {
                return this.cart.syncGuestCartToServer();
              }
              return of(null);
            }),
          );
        }),
      );
  }

  private startOtpExpiry(seconds: number): void {
    this.clearOtpExpiryTimer();
    this.otpExpiresInSeconds.set(Math.max(0, Math.floor(seconds)));
    if (this.otpExpiresInSeconds() <= 0) {
      return;
    }
    this.otpExpiryTimer = setInterval(() => {
      const next = this.otpExpiresInSeconds() - 1;
      if (next <= 0) {
        this.clearOtpExpiryTimer();
        this.otpExpiresInSeconds.set(0);
        this.otpError.set(this.translate.instant('AUTH.OTP_EXPIRED'));
        return;
      }
      this.otpExpiresInSeconds.set(next);
    }, 1000);
  }

  private startResendCooldown(seconds: number): void {
    this.clearResendTimer();
    this.resendSecondsLeft.set(Math.max(0, Math.floor(seconds)));
    if (this.resendSecondsLeft() <= 0) {
      return;
    }
    this.resendTimer = setInterval(() => {
      const next = this.resendSecondsLeft() - 1;
      if (next <= 0) {
        this.clearResendTimer();
        return;
      }
      this.resendSecondsLeft.set(next);
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.resendTimer != null) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
    this.resendSecondsLeft.set(0);
  }

  private clearOtpExpiryTimer(): void {
    if (this.otpExpiryTimer != null) {
      clearInterval(this.otpExpiryTimer);
      this.otpExpiryTimer = null;
    }
  }

  private clearAllOtpTimers(): void {
    this.clearResendTimer();
    this.clearOtpExpiryTimer();
  }
}
