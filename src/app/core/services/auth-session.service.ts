import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { clearCouponStorage } from '../../features/cart/utils/coupon-storage.util';
import { ApiEndpoints } from '../constants/api-endpoints';
import { AuthProfileService } from './auth-profile.service';
import { AuthTokenService } from './auth-token.service';
import { CartService } from './cart.service';
import { ToastService } from './toast.service';
import { WishlistService } from './wishlist.service';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly auth = inject(AuthTokenService);
  private readonly profile = inject(AuthProfileService);
  private readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  private handlingUnauthorized = false;

  /** Clears auth state and restores guest cart/wishlist. */
  clearSession(): void {
    this.auth.clearSession();
    this.profile.setProfile(null);
    clearCouponStorage();
    this.cart.refresh();
    this.wishlist.refresh();
  }

  /** Manual sign-out (header / drawer). */
  signOut(navigateTo = '/home'): void {
    this.handlingUnauthorized = false;
    this.clearSession();
    void this.router.navigateByUrl(navigateTo);
  }

  /**
   * Expired or invalid token (HTTP 401 with Bearer). Runs once for parallel failures.
   */
  handleUnauthorized(currentUrl?: string): void {
    if (this.handlingUnauthorized) {
      return;
    }

    const path = (currentUrl ?? this.router.url).split('?')[0];
    if (path.startsWith('/auth')) {
      return;
    }

    this.handlingUnauthorized = true;
    this.clearSession();
    this.toast.warning(this.translate.instant('AUTH.SESSION_EXPIRED'));

    const returnUrl =
      path && !path.startsWith('/auth') && path !== '/login'
        ? (currentUrl ?? this.router.url)
        : ApiEndpoints.postLoginUrl;

    void this.router.navigate(['/auth/login'], { queryParams: { returnUrl } });
  }

  /** Suppress generic error toast when session expiry was already handled. */
  shouldSuppressUnauthorizedToast(status: number, hadAuthorization: boolean): boolean {
    return status === 401 && hadAuthorization;
  }
}
