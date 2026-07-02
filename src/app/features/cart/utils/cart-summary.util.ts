import { CART_CONFIG } from '../config/cart.config';
import { CartDto, CartItemDto } from '../models/cart.model';
import { CartLineItemView, CartOrderSummaryView } from '../models/cart-view.model';

export interface OrderSummaryOptions {
  deliveryFee?: number;
}

export interface CartMerchandiseTotals {
  subtotal: number;
  productDiscount: number;
  couponDiscount: number;
  merchandiseTotal: number;
}

export function cartItemsHaveEmbeddedProductDiscount(items: CartItemDto[]): boolean {
  return items.some((item) => {
    const qty = Math.max(1, item.Quantity ?? 1);
    const gross = (item.UnitPrice ?? 0) * qty;
    if (gross <= 0) {
      return false;
    }
    // The net line total can arrive as a per-unit FinalPrice, a whole-line FinalPrice, or LineTotal.
    const net =
      item.LineTotal != null && item.LineTotal > 0
        ? item.LineTotal
        : item.FinalPrice != null
          ? item.FinalPrice <= (item.UnitPrice ?? 0)
            ? item.FinalPrice * qty
            : item.FinalPrice
          : gross;
    return net < gross - 0.001;
  });
}

export function resolveGrossSubtotal(rawItems: CartItemDto[]): number {
  return rawItems.reduce((sum, item) => {
    const qty = Math.max(0, item.Quantity ?? 0);
    const unitPrice = item.UnitPrice ?? 0;
    return sum + unitPrice * qty;
  }, 0);
}

function resolveLineNetTotal(lineItems: CartLineItemView[]): number {
  return lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
}


export function resolveCartMerchandiseTotals(
  cart: CartDto | null | undefined,
  lineItems: CartLineItemView[],
  rawItems: CartItemDto[],
  appliedCouponDiscount?: number | null,
): CartMerchandiseTotals {
  // Net total actually charged for the merchandise, derived from the LIVE line items so it tracks
  // a quantity +/- instantly. Each line total is netUnitPrice * quantity (see cart-enrichment),
  // which means it never lags the way the API's cart-level Total/SubTotal fields can.
  const lineNet = resolveLineNetTotal(lineItems);
  const grossSubtotal = resolveGrossSubtotal(rawItems);

  // Discount already baked into the line prices (e.g. unitPrice 550 -> netUnit 522.5).
  const embeddedDiscount = Math.max(0, grossSubtotal - lineNet);

  // Order-level discount the backend keeps OUTSIDE the line totals (SubTotal vs Total gap).
  const cartSubTotal = cart?.SubTotal != null && cart.SubTotal > 0 ? cart.SubTotal : lineNet;
  const cartTotal = cart?.Total != null && cart.Total >= 0 ? cart.Total : lineNet;
  const cartLevelDiscount = Math.max(0, cartSubTotal - cartTotal);

  const couponOnCart = (cart?.CouponDiscountAmount ?? 0) > 0 || !!cart?.CouponCode?.trim();
  const hasClientCoupon = appliedCouponDiscount != null && appliedCouponDiscount > 0;
  const pendingClientCoupon = hasClientCoupon && !couponOnCart;
  const couponViaGap = couponOnCart && cartLevelDiscount > 0;

  // The client-validated coupon (once per order, usageLimit-aware) overrides the backend value
  // ONLY when the coupon is not already baked into the line totals - i.e. it is still pending,
  // or the backend carried it in the cart-level gap (possibly multiplied by quantity).
  if (hasClientCoupon && (pendingClientCoupon || couponViaGap)) {
    const couponDiscount = Math.min(appliedCouponDiscount as number, lineNet);
    return {
      subtotal: grossSubtotal,
      productDiscount: embeddedDiscount,
      couponDiscount,
      merchandiseTotal: Math.max(0, lineNet - couponDiscount),
    };
  }

  // Otherwise trust the backend numbers: the total discount is whatever is embedded in the line
  // prices plus the cart-level gap. Attribute it to product vs coupon for display.
  const totalDiscount = embeddedDiscount + cartLevelDiscount;
  let productDiscount: number;
  let couponDiscount: number;

  if (cart?.DiscountAmount != null && cart.DiscountAmount > 0) {
    productDiscount = Math.min(cart.DiscountAmount, totalDiscount);
    couponDiscount = couponOnCart ? Math.max(0, totalDiscount - productDiscount) : 0;
  } else if (couponOnCart) {
    productDiscount = 0;
    couponDiscount = totalDiscount;
  } else {
    productDiscount = totalDiscount;
    couponDiscount = 0;
  }

  return {
    subtotal: grossSubtotal,
    productDiscount,
    couponDiscount,
    merchandiseTotal: Math.max(0, lineNet - cartLevelDiscount),
  };
}

export function buildOrderSummary(
  merchandise: CartMerchandiseTotals,
  itemCount: number,
  options: OrderSummaryOptions = {},
): CartOrderSummaryView {
  const { subtotal, productDiscount, couponDiscount, merchandiseTotal } = merchandise;
  const isFreeDelivery = merchandiseTotal >= CART_CONFIG.freeDeliveryThreshold;
  const deliveryFee =
    options.deliveryFee ??
    (itemCount > 0 && !isFreeDelivery ? CART_CONFIG.deliveryFee : 0);
  const total = merchandiseTotal + deliveryFee;

  return {
    subtotal,
    productDiscount,
    couponDiscount,
    discount: productDiscount + couponDiscount,
    deliveryFee,
    total,
    itemCount,
    isFreeDelivery,
  };
}
