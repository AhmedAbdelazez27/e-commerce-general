import { CART_CONFIG } from '../config/cart.config';
import { CartCouponDefinition } from '../models/cart-view.model';
import { CartOrderSummaryView } from '../models/cart-view.model';

export function findCoupon(code: string): CartCouponDefinition | undefined {
  const normalized = code.trim().toUpperCase();
  return CART_CONFIG.coupons.find((c) => c.code === normalized);
}

export function buildOrderSummary(
  subtotal: number,
  itemCount: number,
  discountPercent = 0,
): CartOrderSummaryView {
  const discount = discountPercent > 0 ? (subtotal * discountPercent) / 100 : 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const isFreeDelivery = afterDiscount >= CART_CONFIG.freeDeliveryThreshold;
  const deliveryFee = itemCount > 0 && !isFreeDelivery ? CART_CONFIG.deliveryFee : 0;
  const total = afterDiscount + deliveryFee;

  return {
    subtotal,
    discount,
    deliveryFee,
    total,
    itemCount,
    isFreeDelivery,
  };
}
