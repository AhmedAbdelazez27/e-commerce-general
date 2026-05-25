import { Injectable, computed, inject, signal } from '@angular/core';

import { CartService } from '../../../core/services/cart.service';
import { CART_CONFIG } from '../config/cart.config';
import { createDemoCart } from '../data/cart-demo.seed';
import { CartCouponState, CartLineItemView, CartOrderSummaryView } from '../models/cart-view.model';
import { enrichCartItems } from '../utils/cart-enrichment.util';
import { buildOrderSummary, findCoupon } from '../utils/cart-summary.util';

@Injectable()
export class CartPageFacade {
  private readonly cartService = inject(CartService);

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
    this.cartService.refresh();
    if (CART_CONFIG.seedDemoWhenEmpty) {
      const cart = this.cartService.cart();
      if (!cart?.Items?.length) {
        this.cartService.setGuestCart(createDemoCart());
      }
    }
  }

  updateQuantity(productId: number, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeItem(productId: number): void {
    this.cartService.removeItem(productId);
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
  }

  removeCoupon(): void {
    this.couponInput.set('');
    this.couponState.set({ status: 'idle', code: '' });
  }
}
