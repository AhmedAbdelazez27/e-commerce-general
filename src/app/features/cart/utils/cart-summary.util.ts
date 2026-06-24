import { CART_CONFIG } from '../config/cart.config';
import { CartDto } from '../models/cart.model';
import { CartOrderSummaryView } from '../models/cart-view.model';

export interface OrderSummaryOptions {
  discountAmount?: number;
  deliveryFee?: number;
}

export function resolveCartDiscountAmount(
  cart: CartDto | null | undefined,
  subtotal: number,
  appliedDiscountAmount?: number | null,
): number {
  if (cart) {
    if (cart.CouponDiscountAmount != null && cart.CouponDiscountAmount > 0) {
      return cart.CouponDiscountAmount;
    }

    if (cart.DiscountAmount != null && cart.DiscountAmount > 0) {
      return cart.DiscountAmount;
    }

    if (cart.SubTotal != null && cart.Total != null && cart.SubTotal > cart.Total) {
      return cart.SubTotal - cart.Total;
    }
  }

  if (appliedDiscountAmount != null && appliedDiscountAmount > 0) {
    return appliedDiscountAmount;
  }

  return 0;
}

export function buildOrderSummary(
  subtotal: number,
  itemCount: number,
  options: OrderSummaryOptions = {},
): CartOrderSummaryView {
  const discount = options.discountAmount ?? 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const isFreeDelivery = afterDiscount >= CART_CONFIG.freeDeliveryThreshold;
  const deliveryFee =
    options.deliveryFee ??
    (itemCount > 0 && !isFreeDelivery ? CART_CONFIG.deliveryFee : 0);
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
