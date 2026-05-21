import { Injectable } from '@angular/core';

import { LoginDataDto } from '../../features/auth/models/login.models';
import { AppLang } from './language.service';

const TOKEN_KEY = 'token';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserId(): string | null {
    return localStorage.getItem('userId') ?? sessionStorage.getItem('userId');
  }

  getCustomerId(): string | null {
    return this.getUserId();
  }

  getEmail(): string | null {
    return localStorage.getItem('email') ?? sessionStorage.getItem('email');
  }

  getUserDisplayName(lang: AppLang): string | null {
    const key = lang === 'ar' ? 'userNameAr' : 'userNameEn';
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  }

  saveLoginData(data: LoginDataDto, remember = true): void {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEY, data.Token);
    storage.setItem('refreshToken', data.RefreshToken);
    storage.setItem('userId', data.UserId);
    storage.setItem('tokenValidTo', data.TokenValidTo);
    storage.setItem('userNameEn', data.NameEn);
    storage.setItem('userNameAr', data.NameAr);
    storage.setItem('email', data.Email);
  }

  saveAccessToken(token: string, remember = true): void {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEY, token);
  }

  clearSession(): void {
    const keys = [
      TOKEN_KEY,
      'refreshToken',
      'userId',
      'tokenValidTo',
      'userNameEn',
      'userNameAr',
      'email',
      'auth_token',
      'access_token',
      'user_profile',
    ];
    for (const key of keys) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  }
}
