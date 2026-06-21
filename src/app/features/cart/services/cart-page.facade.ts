import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { AuthTokenService } from '../../../core/services/auth-token.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { CheckoutStateService } from '../../checkout/services/checkout-state.service';
import { EcCouponDto } from '../models/ec-coupon.model';
import { CartCouponState, CartLineItemView, CartOrderSummaryView } from '../models/cart-view.model';
import { EcCouponsApiService } from '../services/ec-coupons-api.service';
import { enrichCartItems } from '../utils/cart-enrichment.util';
import {
  clearCouponStorage,
  readAppliedCouponCode,
  readPendingCouponCode,
  writeAppliedCouponCode,
  writePendingCouponCode,
} from '../utils/coupon-storage.util';
import {
  couponRejectMessageKey,
  estimateCouponDiscount,
  validateCouponForCart,
} from '../utils/coupon-validation.util';
import { buildOrderSummary, resolveCartDiscountAmount } from '../utils/cart-summary.util';

@Injectable()
export class CartPageFacade {
  private readonly cartService = inject(CartService);
  private readonly auth = inject(AuthTokenService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly couponsApi = inject(EcCouponsApiService);
  private readonly checkoutState = inject(CheckoutStateService);

  readonly couponInput = signal('');
  readonly couponState = signal<CartCouponState>({ status: 'idle', code: '' });
  private readonly appliedCouponMeta = signal<EcCouponDto | null>(null);

  readonly lineItems = computed((): CartLineItemView[] => {
    const cart = this.cartService.cart();
    if (!cart?.Items?.length) {
      return [];
    }
    return enrichCartItems(cart.Items);
  });

  readonly isEmpty = computed(() => this.lineItems().length === 0);
  readonly isLoading = computed(() => this.cartService.loading());

  readonly hasUnavailableItems = computed(() =>
    this.lineItems().some((item) => !item.isAvailable),
  );

  readonly canCheckout = computed(
    () => !this.isEmpty() && !this.hasUnavailableItems() && !this.isLoading(),
  );

  readonly orderSummary = computed((): CartOrderSummaryView => {
    const cart = this.cartService.cart();
    const lineSubtotal = this.lineItems().reduce((sum, item) => sum + item.lineTotal, 0);
    const subtotal =
      cart?.SubTotal != null && cart.SubTotal > 0 ? cart.SubTotal : lineSubtotal;
    const itemCount = this.lineItems().reduce((sum, item) => sum + item.quantity, 0);
    const appliedCoupon =
      this.couponState().status === 'applied' ? this.appliedCouponMeta() : null;
    const discount = resolveCartDiscountAmount(cart, subtotal, appliedCoupon);
    const summary = buildOrderSummary(subtotal, itemCount, { discountAmount: discount });

    if (cart?.Total != null && cart.Total >= 0 && discount > 0) {
      const serverNet = cart.Total;
      const deliveryFee = summary.deliveryFee;
      const impliedNet = summary.subtotal - summary.discount;
      if (Math.abs(serverNet - impliedNet) > 0.01 && serverNet < summary.subtotal) {
        return {
          ...summary,
          total: serverNet + deliveryFee,
        };
      }
    }

    return summary;
  });

  constructor() {
    effect(() => {
      if (this.cartService.loading()) {
        return;
      }
      if (this.couponState().status !== 'applied') {
        return;
      }
      this.revalidateAppliedCoupon();
    });
  }

  initPage(): void {
    const queryCode = this.route.snapshot.queryParamMap.get('coupon')?.trim();
    if (queryCode) {
      this.couponInput.set(queryCode.toUpperCase());
    }

    const pending = readPendingCouponCode();
    if (pending) {
      writePendingCouponCode(null);
      this.couponInput.set(pending);
      if (this.auth.isLoggedIn()) {
        this.applyCoupon();
        return;
      }
    }

    const stored = readAppliedCouponCode();
    if (stored && this.couponState().status === 'idle') {
      this.couponInput.set(stored);
      if (this.auth.isLoggedIn()) {
        this.applyCoupon();
        return;
      }
    }

    const coupon =
      this.couponState().status === 'applied' ? this.couponState().appliedCode : null;
    this.cartService.refresh(coupon ?? stored);
  }

  updateQuantity(cartDetailId: number, quantity: number): void {
    const coupon =
      this.couponState().status === 'applied' ? this.couponState().appliedCode : null;
    this.cartService.updateQuantity(cartDetailId, quantity, coupon);
  }

  removeItem(cartDetailId: number): void {
    const coupon =
      this.couponState().status === 'applied' ? this.couponState().appliedCode : null;
    this.cartService.removeItem(cartDetailId, coupon);
  }

  clearCart(): void {
    const coupon =
      this.couponState().status === 'applied' ? this.couponState().appliedCode : null;
    this.cartService.clearCart(coupon).subscribe();
    this.removeCoupon(false);
  }

  applyCoupon(): void {
    const code = this.couponInput().trim().toUpperCase();
    if (!code) {
      this.couponState.set({ status: 'idle', code: '' });
      return;
    }

    if (!this.auth.isLoggedIn()) {
      writePendingCouponCode(code);
      this.toast.info(this.translate.instant('CART.COUPON.LOGIN_REQUIRED'));
      void this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/cart' },
      });
      return;
    }

    const subtotal = this.lineItems().reduce((sum, item) => sum + item.lineTotal, 0);
    this.couponState.set({ status: 'loading', code });

    this.couponsApi
      .getByCode(code)
      .pipe(finalize(() => {}))
      .subscribe({
        next: (coupon) => {
          const validation = validateCouponForCart(coupon, subtotal, true);
          if (!validation.valid) {
            this.couponState.set({
              status: 'invalid',
              code,
              messageKey: couponRejectMessageKey(validation.reason),
              messageParams: validation.params,
            });
            return;
          }

          this.appliedCouponMeta.set(validation.coupon);
          const estimatedSavings = estimateCouponDiscount(validation.coupon, subtotal);

          this.couponState.set({
            status: 'applied',
            code,
            appliedCode: validation.coupon.code,
            messageKey: 'CART.COUPON.APPLIED',
            messageParams: {
              code: validation.coupon.code,
              savings: estimatedSavings,
            },
          });

          writeAppliedCouponCode(validation.coupon.code);
          this.checkoutState.setCouponCode(validation.coupon.code);
          this.cartService.refresh(validation.coupon.code);
        },
        error: () => {
          this.couponState.set({
            status: 'invalid',
            code,
            messageKey: 'CART.COUPON.NOT_FOUND',
          });
        },
      });
  }

  removeCoupon(refreshCart = true): void {
    this.couponInput.set('');
    this.couponState.set({ status: 'idle', code: '' });
    this.appliedCouponMeta.set(null);
    clearCouponStorage();
    this.checkoutState.setCouponCode(null);
    if (refreshCart) {
      this.cartService.refresh(null);
    }
  }

  syncCheckoutCoupon(): void {
    const state = this.couponState();
    if (state.status === 'applied' && state.appliedCode) {
      this.checkoutState.setCouponCode(state.appliedCode);
    }
  }

  tryCheckout(): boolean {
    if (this.isEmpty()) {
      this.toast.warning(this.translate.instant('CART.CHECKOUT_EMPTY'));
      return false;
    }
    if (this.hasUnavailableItems()) {
      this.toast.warning(this.translate.instant('CART.CHECKOUT_UNAVAILABLE'));
      return false;
    }
    if (!this.auth.isLoggedIn()) {
      void this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/checkout/payment' },
      });
      return false;
    }
    this.syncCheckoutCoupon();
    return true;
  }

  private revalidateAppliedCoupon(): void {
    const state = this.couponState();
    if (state.status !== 'applied' || !state.appliedCode) {
      return;
    }

    const coupon = this.appliedCouponMeta();
    if (!coupon) {
      return;
    }

    const subtotal = this.lineItems().reduce((sum, item) => sum + item.lineTotal, 0);
    const validation = validateCouponForCart(coupon, subtotal, this.auth.isLoggedIn());

    if (!validation.valid && validation.reason === 'min_order') {
      this.toast.warning(
        this.translate.instant(couponRejectMessageKey(validation.reason), validation.params),
      );
      this.removeCoupon();
    }
  }
}
