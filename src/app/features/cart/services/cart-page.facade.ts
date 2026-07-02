import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { AuthTokenService } from '../../../core/services/auth-token.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { CheckoutApiService } from '../../checkout/services/checkout-api.service';
import { CheckoutStateService } from '../../checkout/services/checkout-state.service';
import { CartCouponState, CartLineItemView, CartOrderSummaryView } from '../models/cart-view.model';
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
  validateCouponApiResult,
} from '../utils/coupon-validation.util';
import {
  buildOrderSummary,
  cartItemsHaveEmbeddedProductDiscount,
  resolveCartMerchandiseTotals,
} from '../utils/cart-summary.util';

@Injectable()
export class CartPageFacade {
  private readonly cartService = inject(CartService);
  private readonly auth = inject(AuthTokenService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly checkoutApi = inject(CheckoutApiService);
  private readonly checkoutState = inject(CheckoutStateService);

  readonly couponInput = signal('');
  readonly couponState = signal<CartCouponState>({ status: 'idle', code: '' });
  private readonly appliedDiscountAmount = signal<number | null>(null);

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
    const lines = this.lineItems();
    const itemCount = lines.reduce((sum, item) => sum + item.quantity, 0);
    const appliedDiscount =
      this.couponState().status === 'applied' ? this.appliedDiscountAmount() : null;
    const merchandise = resolveCartMerchandiseTotals(
      cart,
      lines,
      cart?.Items ?? [],
      appliedDiscount,
    );

    return buildOrderSummary(merchandise, itemCount);
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

    const customerId = this.resolveCustomerId();
    if (customerId <= 0) {
      this.couponState.set({
        status: 'invalid',
        code,
        messageKey: 'CART.COUPON.LOGIN_REQUIRED',
      });
      return;
    }

    const subtotal = this.resolveOrderSubtotal();
    this.couponState.set({ status: 'loading', code });

    this.checkoutApi
      .validateCoupon({
        couponCode: code,
        totalOrder: subtotal,
        customerId,
      })
      .pipe(finalize(() => {}))
      .subscribe({
        next: (result) => {
          const validation = validateCouponApiResult(result, subtotal);
          if (!validation.valid) {
            this.couponState.set({
              status: 'invalid',
              code,
              messageKey: couponRejectMessageKey(validation.reason),
              messageParams: validation.params,
            });
            return;
          }

          const discountAmount = validation.discountAmount;
          this.appliedDiscountAmount.set(discountAmount);

          this.couponState.set({
            status: 'applied',
            code,
            appliedCode: code,
            messageKey: 'CART.COUPON.APPLIED',
            messageParams: {
              code,
              savings: discountAmount,
            },
          });

          writeAppliedCouponCode(code);
          this.checkoutState.setCouponCode(code);
          this.checkoutState.setCouponDiscountAmount(discountAmount);
          this.cartService.refresh(code);
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
    this.appliedDiscountAmount.set(null);
    clearCouponStorage();
    this.checkoutState.setCouponCode(null);
    this.checkoutState.setCouponDiscountAmount(0);
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

    const customerId = this.resolveCustomerId();
    if (customerId <= 0) {
      return;
    }

    const code = state.appliedCode;
    const subtotal = this.resolveOrderSubtotal();

    this.checkoutApi
      .validateCoupon({
        couponCode: code,
        totalOrder: subtotal,
        customerId,
      })
      .subscribe({
        next: (result) => {
          const validation = validateCouponApiResult(result, subtotal);
          if (!validation.valid) {
            if (validation.reason === 'min_order' || validation.reason === 'min_order_remaining') {
              this.toast.warning(
                this.translate.instant(
                  couponRejectMessageKey(validation.reason),
                  validation.params,
                ),
              );
            }
            this.removeCoupon();
            return;
          }

          this.appliedDiscountAmount.set(validation.discountAmount);
          this.checkoutState.setCouponDiscountAmount(validation.discountAmount);
        },
        error: () => {
          this.removeCoupon();
        },
      });
  }

  private resolveOrderSubtotal(): number {
    const cart = this.cartService.cart();
    const lineSubtotal = this.lineItems().reduce((sum, item) => sum + item.lineTotal, 0);
    const rawItems = cart?.Items ?? [];
    if (cartItemsHaveEmbeddedProductDiscount(rawItems)) {
      return lineSubtotal;
    }
    return cart?.SubTotal != null && cart.SubTotal > 0 ? cart.SubTotal : lineSubtotal;
  }

  private resolveCustomerId(): number {
    const raw = this.auth.getCustomerId();
    if (!raw?.trim()) {
      return 0;
    }
    const id = Number(raw);
    return Number.isFinite(id) ? id : 0;
  }
}
