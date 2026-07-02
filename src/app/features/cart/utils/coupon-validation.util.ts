import { EcCouponDto } from '../models/ec-coupon.model';
import type { ValidateCouponResultDto } from '../../checkout/models/validate-coupon.model';

export type CouponRejectReason =
  | 'not_found'
  | 'inactive'
  | 'not_started'
  | 'expired'
  | 'usage_exceeded'
  | 'min_order'
  | 'min_order_remaining'
  | 'guest_requires_login';

export type CouponValidationResult =
  | { valid: true; coupon: EcCouponDto }
  | { valid: false; reason: CouponRejectReason; params?: Record<string, string | number> };

export type CouponApiValidationResult =
  | { valid: true; discountAmount: number }
  | { valid: false; reason: CouponRejectReason; params?: Record<string, string | number> };

const REASON_MESSAGE_KEYS: Record<CouponRejectReason, string> = {
  not_found: 'CART.COUPON.NOT_FOUND',
  inactive: 'CART.COUPON.INACTIVE',
  not_started: 'CART.COUPON.NOT_STARTED',
  expired: 'CART.COUPON.EXPIRED',
  usage_exceeded: 'CART.COUPON.USAGE_EXCEEDED',
  min_order: 'CART.COUPON.MIN_ORDER',
  min_order_remaining: 'CART.COUPON.MIN_ORDER_REMAINING',
  guest_requires_login: 'CART.COUPON.LOGIN_REQUIRED',
};

export function couponRejectMessageKey(reason: CouponRejectReason): string {
  return REASON_MESSAGE_KEYS[reason];
}

/**
 * Coupon discount applies once per order (not per quantity).
 * When the API returns a per-qty `discountAmount` higher than the order cap `usageLimit`,
 * use `usageLimit` as the effective discount.
 */
export function resolveValidatedCouponDiscount(
  result: ValidateCouponResultDto,
  orderSubtotal?: number,
): number {
  const discountAmount = Math.max(0, result.discountAmount ?? 0);
  const usageLimit = result.usageLimit;

  let resolved = discountAmount;
  if (usageLimit != null && usageLimit > 0 && usageLimit < discountAmount) {
    resolved = usageLimit;
  }

  if (orderSubtotal != null && orderSubtotal > 0) {
    resolved = Math.min(resolved, orderSubtotal);
  }

  return Math.max(0, resolved);
}

function isAbpYes(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'yes';
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return false;
}

function isAbpActive(value: unknown): boolean {
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'yes' || normalized === 'true';
  }
  return false;
}

export function validateCouponApiResult(
  result: ValidateCouponResultDto | null | undefined,
  orderSubtotal?: number,
): CouponApiValidationResult {
  if (!result) {
    return { valid: false, reason: 'not_found' };
  }

  if (!isAbpActive(result.isActive)) {
    return { valid: false, reason: 'inactive' };
  }

  if (!isAbpYes(result.validDate)) {
    return { valid: false, reason: 'expired' };
  }

  if (!isAbpYes(result.validAmount)) {
    const remaining = result.remainingAmountToBeUsed ?? 0;
    if (remaining > 0) {
      return {
        valid: false,
        reason: 'min_order_remaining',
        params: { amount: remaining },
      };
    }
    return { valid: false, reason: 'min_order' };
  }

  return {
    valid: true,
    discountAmount: resolveValidatedCouponDiscount(result, orderSubtotal),
  };
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
