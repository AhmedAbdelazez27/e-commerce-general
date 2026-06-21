import { EcCouponDto } from '../models/ec-coupon.model';

export type CouponRejectReason =
  | 'not_found'
  | 'inactive'
  | 'not_started'
  | 'expired'
  | 'usage_exceeded'
  | 'min_order'
  | 'guest_requires_login';

export type CouponValidationResult =
  | { valid: true; coupon: EcCouponDto }
  | { valid: false; reason: CouponRejectReason; params?: Record<string, string | number> };

const REASON_MESSAGE_KEYS: Record<CouponRejectReason, string> = {
  not_found: 'CART.COUPON.NOT_FOUND',
  inactive: 'CART.COUPON.INACTIVE',
  not_started: 'CART.COUPON.NOT_STARTED',
  expired: 'CART.COUPON.EXPIRED',
  usage_exceeded: 'CART.COUPON.USAGE_EXCEEDED',
  min_order: 'CART.COUPON.MIN_ORDER',
  guest_requires_login: 'CART.COUPON.LOGIN_REQUIRED',
};

export function couponRejectMessageKey(reason: CouponRejectReason): string {
  return REASON_MESSAGE_KEYS[reason];
}

export function validateCouponForCart(
  coupon: EcCouponDto | null | undefined,
  subtotal: number,
  isLoggedIn: boolean,
  now = new Date(),
): CouponValidationResult {
  if (!isLoggedIn) {
    return { valid: false, reason: 'guest_requires_login' };
  }

  if (!coupon) {
    return { valid: false, reason: 'not_found' };
  }

  if (!coupon.isActive) {
    return { valid: false, reason: 'inactive' };
  }

  if (coupon.startDate) {
    const start = new Date(coupon.startDate);
    if (!Number.isNaN(start.getTime()) && now < start) {
      return { valid: false, reason: 'not_started' };
    }
  }

  if (coupon.endDate) {
    const end = new Date(coupon.endDate);
    if (!Number.isNaN(end.getTime()) && now > end) {
      return { valid: false, reason: 'expired' };
    }
  }

  if (coupon.usageLimit != null && coupon.usageLimit > 0) {
    const used = coupon.usedCount ?? 0;
    if (used >= coupon.usageLimit) {
      return { valid: false, reason: 'usage_exceeded' };
    }
  }

  const minimum = coupon.minimumOrderAmount ?? 0;
  if (minimum > 0 && subtotal < minimum) {
    return {
      valid: false,
      reason: 'min_order',
      params: { amount: minimum },
    };
  }

  return { valid: true, coupon };
}

export function estimateCouponDiscount(coupon: EcCouponDto, subtotal: number): number {
  if (subtotal <= 0 || coupon.discountValue <= 0) {
    return 0;
  }

  const type = coupon.discountType?.toLowerCase() ?? '';
  if (type.includes('percent')) {
    return Math.min(subtotal, (subtotal * coupon.discountValue) / 100);
  }

  return Math.min(subtotal, coupon.discountValue);
}
