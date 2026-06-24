import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { AuthTokenService } from '../../../core/services/auth-token.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { resultFromAbpEnvelope } from '../../../core/utils/api-envelope.util';
import { ExternalAuthenticateRequest } from '../models/external-auth.models';
import {
  abpErrorMessage,
  parseExternalAuthEnvelopeDetailed,
} from '../utils/auth-abp.util';
import { externalAuthErrorKey } from '../utils/external-auth-error.util';
import { AuthApiService } from './auth-api.service';
import { SocialAuthSdkService } from './social-auth-sdk.service';

export interface ExternalAuthLoginResult {
  requiresProfileCompletion: boolean;
  targetUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ExternalAuthService {
  private readonly authApi = inject(AuthApiService);
  private readonly socialSdk = inject(SocialAuthSdkService);
  private readonly tokens = inject(AuthTokenService);
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  loginWithGoogleIdToken(
    idToken: string,
    returnUrl?: string | null,
  ): Observable<ExternalAuthLoginResult> {
    return this.fromToken(idToken, 'Google', returnUrl);
  }

  loginWithFacebook(returnUrl?: string | null): Observable<ExternalAuthLoginResult> {
    return this.fromSdkPromise(this.socialSdk.signInWithFacebook(), 'Facebook', returnUrl);
  }

  private fromSdkPromise(
    sdkPromise: Promise<string>,
    provider: ExternalAuthenticateRequest['provider'],
    returnUrl?: string | null,
  ): Observable<ExternalAuthLoginResult> {
    return new Observable<string>((subscriber) => {
      sdkPromise.then(
        (token) => {
          subscriber.next(token);
          subscriber.complete();
        },
        (err) => subscriber.error(err),
      );
    }).pipe(switchMap((token) => this.fromToken(token, provider, returnUrl)));
  }

  private fromToken(
    token: string,
    provider: ExternalAuthenticateRequest['provider'],
    returnUrl?: string | null,
  ): Observable<ExternalAuthLoginResult> {
    const body: ExternalAuthenticateRequest =
      provider === 'Google' ? { provider, idToken: token } : { provider, accessToken: token };

    return this.authApi.externalAuthenticate(body).pipe(
      switchMap((res) => this.completeExternalSession(res, returnUrl)),
      catchError((err) => {
        this.toast.error(this.resolveErrorMessage(err));
        throw err;
      }),
    );
  }

  private completeExternalSession(
    res: unknown,
    returnUrl?: string | null,
  ): Observable<ExternalAuthLoginResult> {
    const parsed = parseExternalAuthEnvelopeDetailed(res);
    if (!parsed) {
      this.toast.error(this.translate.instant('AUTH.EXTERNAL_LOGIN_FAILED'));
      return throwError(() => new Error('EXTERNAL_AUTH_PARSE_FAILED'));
    }

    const rememberMe = true;
    this.tokens.saveLoginData(parsed.loginData, rememberMe);

    const loadProfile$ =
      parsed.customerId != null
        ? of(parsed.customerId)
        : this.authApi.getECommerceCustomerProfile().pipe(
            map((profileRes) => {
              const profile = resultFromAbpEnvelope<{ id?: number }>(profileRes);
              const customerId = profile?.id != null ? String(profile.id) : null;
              this.tokens.saveCustomerId(customerId, rememberMe);
              return customerId;
            }),
          );

    return loadProfile$.pipe(
      switchMap((customerId) => {
        if (!customerId || !this.cart.hasGuestCart()) {
          return of(null);
        }
        return this.cart.syncGuestCartToServer();
      }),
      tap(() => this.cart.refresh()),
      map(() => ({
        requiresProfileCompletion: parsed.requiresProfileCompletion,
        targetUrl: this.resolveTargetUrl(returnUrl, parsed.requiresProfileCompletion),
      })),
      tap((result) => {
        this.toast.success(this.translate.instant('AUTH.LOGIN_SUCCESS'));
        void this.router.navigateByUrl(result.targetUrl);
      }),
    );
  }

  private resolveTargetUrl(returnUrl: string | null | undefined, requiresProfileCompletion: boolean): string {
    if (requiresProfileCompletion) {
      return '/account/profile?completeProfile=1';
    }
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('/auth')) {
      return returnUrl;
    }
    return ApiEndpoints.postLoginUrl;
  }

  private resolveErrorMessage(err: unknown): string {
    if (err instanceof Error) {
      const code = err.message;
      if (code === 'GOOGLE_LOGIN_CANCELLED' || code === 'FACEBOOK_LOGIN_CANCELLED') {
        return this.translate.instant('AUTH.EXTERNAL_LOGIN_CANCELLED');
      }
      if (code === 'GOOGLE_PROMPT_UNAVAILABLE') {
        return this.translate.instant('AUTH.EXTERNAL_GOOGLE_UNAVAILABLE');
      }
      if (code === 'GOOGLE_NOT_CONFIGURED' || code === 'FACEBOOK_NOT_CONFIGURED') {
        return this.translate.instant('AUTH.EXTERNAL_NOT_CONFIGURED');
      }
    }

    const backendMessage = abpErrorMessage(err, '');
    const mappedKey = externalAuthErrorKey(backendMessage);
    if (mappedKey) {
      return this.translate.instant(mappedKey);
    }
    if (backendMessage) {
      return backendMessage;
    }
    return this.translate.instant('AUTH.EXTERNAL_LOGIN_FAILED');
  }
}
