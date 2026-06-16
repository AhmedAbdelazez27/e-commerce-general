import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { CartCouponState, CartLineItemView, CartOrderSummaryView } from '../models/cart-view.model';
import { enrichCartItems } from '../utils/cart-enrichment.util';
import { buildOrderSummary, findCoupon } from '../utils/cart-summary.util';

@Injectable()
export class CartPageFacade {
  private readonly cartService = inject(CartService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly couponInput = signal('');
  readonly couponState = signal<CartCouponState>({ status: 'idle', code: '' });

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

  readonly appliedDiscountPercent = computed(() => {
    const state = this.couponState();
    if (state.status !== 'applied' || !state.appliedCode) {
      return 0;
    }
    return findCoupon(state.appliedCode)?.percentOff ?? 0;
  });

  readonly orderSummary = computed((): CartOrderSummaryView => {
    const subtotal = this.lineItems().reduce((sum, item) => sum + item.lineTotal, 0);
    const itemCount = this.lineItems().reduce((sum, item) => sum + item.quantity, 0);
    return buildOrderSummary(subtotal, itemCount, this.appliedDiscountPercent());
  });

  initPage(): void {
    const coupon =
      this.couponState().status === 'applied' ? this.couponState().appliedCode : null;
    this.cartService.refresh(coupon);
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
  }

  applyCoupon(): void {
    const code = this.couponInput().trim();
    if (!code) {
      this.couponState.set({ status: 'idle', code: '' });
      return;
    }
    const coupon = findCoupon(code);
    if (!coupon) {
      this.couponState.set({
        status: 'invalid',
        code,
        messageKey: 'CART.COUPON.INVALID',
      });
      return;
    }
    this.couponState.set({
      status: 'applied',
      code,
      appliedCode: coupon.code,
      messageKey: coupon.labelKey,
    });
    this.cartService.refresh(coupon.code);
  }

  removeCoupon(): void {
    this.couponInput.set('');
    this.couponState.set({ status: 'idle', code: '' });
    this.cartService.refresh(null);
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
    return true;
  }
}
