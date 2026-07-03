import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { SKIP_AUTH, SKIP_UNAUTHORIZED_HANDLING } from '../../../core/http/http-context.tokens';
import { TokenAuthRequest } from '../models/login.models';
import { ForgetPasswordQuery, PostForgetPasswordRequest } from '../models/forget-password.models';
import { RegisterECommerceCustomerRequest, RegisterFormValue } from '../models/register.models';
import { ExternalAuthenticateRequest } from '../models/external-auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  authenticate(credentials: TokenAuthRequest): Observable<unknown> {
    return this.postAnonymous(ApiEndpoints.Auth.authenticate, credentials);
  }

  externalAuthenticate(body: ExternalAuthenticateRequest): Observable<unknown> {
    return this.postAnonymous(ApiEndpoints.Auth.externalAuthenticateECommerce, body);
  }

  register(form: RegisterFormValue, sessionId: string | null): Observable<unknown> {
    const email = form.email.trim().toLowerCase();
    const body: RegisterECommerceCustomerRequest = {
      fullName: form.fullName.trim(),
      email,
      mobile: form.mobile.trim(),
      password: form.password,
      sessionId: sessionId?.trim() ? sessionId.trim() : null,
      birthDate: form.birthDate?.trim() ? form.birthDate.trim() : null,
      gender: form.gender?.trim() ? form.gender.trim() : null,
    };
    return this.postAnonymous<unknown>(ApiEndpoints.Auth.registerECommerceCustomer, body);
  }

  getECommerceCustomerProfile(): Observable<unknown> {
    return this.http.get<unknown>(ApiEndpoints.Auth.getECommerceCustomerProfile);
  }

  mergeGuestCart(customerId: string, sessionId: string): Observable<unknown> {
    return this.http.post<unknown>(ApiEndpoints.EcCart.mergeGuestCart, {
      customerId: Number(customerId),
      sessionId,
    });
  }

  forgetPassword(query: ForgetPasswordQuery): Observable<unknown> {
    const params = new HttpParams()
      .set('Email', query.email)
      .set('TenantId', String(query.tenantId));
    return this.postAnonymous(ApiEndpoints.Auth.forgetPassword, null, params);
  }

  postForgetPassword(body: PostForgetPasswordRequest): Observable<unknown> {
    return this.postAnonymous(ApiEndpoints.Auth.postForgetPassword, body);
  }

  private postAnonymous<T>(url: string, body: unknown, params?: HttpParams): Observable<T> {
    const context = new HttpContext()
      .set(SKIP_AUTH, true)
      .set(SKIP_UNAUTHORIZED_HANDLING, true);
    return this.http.post<T>(url, body, { context, params });
  }
}
