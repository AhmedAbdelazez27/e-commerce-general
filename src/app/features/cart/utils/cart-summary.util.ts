import { CART_CONFIG } from '../config/cart.config';
import { CartDto, CartItemDto } from '../models/cart.model';
import { CartLineItemView, CartOrderSummaryView } from '../models/cart-view.model';

export interface OrderSummaryOptions {
  discountAmount?: number;
  deliveryFee?: number;
  merchandiseTotal?: number;
}

export interface CartMerchandiseTotals {
  subtotal: number;
  discount: number;
  merchandiseTotal: number;
}

export function cartItemsHaveEmbeddedProductDiscount(items: CartItemDto[]): boolean {
  return items.some(
    (item) =>
      item.FinalPrice != null &&
      item.UnitPrice > 0 &&
      item.FinalPrice < item.UnitPrice,
  );
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

export function resolveCartMerchandiseTotals(
  cart: CartDto | null | undefined,
  lineItems: CartLineItemView[],
  rawItems: CartItemDto[],
  appliedCouponDiscount?: number | null,
): CartMerchandiseTotals {
  const lineSum = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const embedded = cartItemsHaveEmbeddedProductDiscount(rawItems);

  if (embedded) {
    const couponDiscount = resolveEmbeddedCouponDiscount(cart, appliedCouponDiscount);
    const merchandiseTotal =
      cart?.Total != null && cart.Total >= 0
        ? cart.Total
        : Math.max(0, lineSum - couponDiscount);

    return {
      subtotal: lineSum,
      discount: couponDiscount,
      merchandiseTotal,
    };
  }

  const subtotal =
    cart?.SubTotal != null && cart.SubTotal > 0 ? cart.SubTotal : lineSum;
  const discount = resolveCartDiscountAmount(cart, subtotal, appliedCouponDiscount);
  const merchandiseTotal =
    cart?.Total != null && cart.Total >= 0
      ? cart.Total
      : Math.max(0, subtotal - discount);

  return {
    subtotal,
    discount,
    merchandiseTotal,
  };
}

function resolveEmbeddedCouponDiscount(
  cart: CartDto | null | undefined,
  appliedCouponDiscount?: number | null,
): number {
  if (cart?.CouponDiscountAmount != null && cart.CouponDiscountAmount > 0) {
    return cart.CouponDiscountAmount;
  }

  if (appliedCouponDiscount != null && appliedCouponDiscount > 0) {
    return appliedCouponDiscount;
  }

  return 0;
}

export function buildOrderSummary(
  subtotal: number,
  itemCount: number,
  options: OrderSummaryOptions = {},
): CartOrderSummaryView {
  const discount = options.discountAmount ?? 0;
  const merchandiseNet =
    options.merchandiseTotal ?? Math.max(0, subtotal - discount);
  const isFreeDelivery = merchandiseNet >= CART_CONFIG.freeDeliveryThreshold;
  const deliveryFee =
    options.deliveryFee ??
    (itemCount > 0 && !isFreeDelivery ? CART_CONFIG.deliveryFee : 0);
  const total = merchandiseNet + deliveryFee;

  return {
    subtotal,
    discount,
    deliveryFee,
    total,
    itemCount,
    isFreeDelivery,
  };
}
