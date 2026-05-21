import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { SKIP_AUTH } from '../../../core/http/http-context.tokens';
import { ApiResponse, LoginDataDto, LoginRequest, UserProfile } from '../models/login.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  private authUrl(path: string): string {
    return `${ApiEndpoints.Auth.base}${path}`;
  }

  login(credentials: LoginRequest): Observable<ApiResponse<LoginDataDto>> {
    return this.postAnonymous<ApiResponse<LoginDataDto>>(this.authUrl(ApiEndpoints.Auth.login), credentials);
  }

  getMyProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(ApiEndpoints.Account.profile);
  }

  logout(): Observable<unknown> {
    return this.http.post(this.authUrl(ApiEndpoints.Auth.logout), {});
  }

  private postAnonymous<T>(url: string, body: unknown): Observable<T> {
    const context = new HttpContext().set(SKIP_AUTH, true);
    return this.http.post<T>(url, body, { context });
  }
}
