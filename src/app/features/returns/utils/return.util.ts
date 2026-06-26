import { normalizeStatusToken } from '../../account/utils/account-order.util';
import type { EcOrderDto } from '../../checkout/models/place-order.model';
import type { EcReturnDto, ReturnListFilter } from '../models/return.model';

export interface ReturnTrackingStep {
  id: string;
  labelKey: string;
  done: boolean;
  current: boolean;
}

const COMPLETED_RETURN_STATUSES = new Set([
  'refunded',
  'completed',
  'closed',
  'rejected',
  'declined',
  'cancelled',
  'canceled',
]);

const ELIGIBLE_ORDER_STATUSES = new Set(['delivered', 'completed', 'closed']);

export function canRequestReturnForOrder(order: EcOrderDto): boolean {
  const tokens = [order.orderStatus, order.shippingStatus].map(normalizeStatusToken);
  if (tokens.some((status) => ['cancelled', 'canceled', 'refunded'].includes(status))) {
    return false;
  }
  return tokens.some((status) => ELIGIBLE_ORDER_STATUSES.has(status));
}

export function isActiveReturn(ret: EcReturnDto): boolean {
  const token = returnStatusToken(ret);
  return token ? !COMPLETED_RETURN_STATUSES.has(token) : true;
}

export function isCompletedReturn(ret: EcReturnDto): boolean {
  return !isActiveReturn(ret);
}

export function filterReturns(items: EcReturnDto[], filter: ReturnListFilter): EcReturnDto[] {
  if (filter === 'all') {
    return items;
  }
  if (filter === 'active') {
    return items.filter(isActiveReturn);
  }
  return items.filter(isCompletedReturn);
}

export function returnStatusToken(ret: EcReturnDto): string {
  return normalizeStatusToken(ret.returnStatusNameEn ?? ret.returnStatusNameAr);
}

export function returnStatusDisplayName(ret: EcReturnDto, isArabic: boolean): string {
  const localized = isArabic ? ret.returnStatusNameAr : ret.returnStatusNameEn;
  if (localized?.trim()) {
    return localized.trim();
  }
  const fallback = isArabic ? ret.returnStatusNameEn : ret.returnStatusNameAr;
  return fallback?.trim() ?? '';
}

export function hasActiveReturnForOrderDetail(
  returns: EcReturnDto[],
  orderDetailId: number | undefined,
): boolean {
  if (orderDetailId == null) {
    return false;
  }
  return returns.some((ret) => ret.orderDetailId === orderDetailId && isActiveReturn(ret));
}

export function returnTrackingSteps(ret: EcReturnDto): ReturnTrackingStep[] {
  const token = returnStatusToken(ret);
  const isRejected = ['rejected', 'declined', 'cancelled', 'canceled'].includes(token);
  const isRefunded = ['refunded', 'completed', 'closed'].includes(token);
  const isApproved = isRefunded || ['approved', 'accepted'].includes(token);
  const isReviewing =
    isApproved || ['review', 'reviewing', 'pending', 'submitted', 'processing'].includes(token);

  let currentIndex = 0;
  if (isRejected) {
    currentIndex = 1;
  } else if (isRefunded) {
    currentIndex = 3;
  } else if (isApproved) {
    currentIndex = 2;
  } else if (isReviewing) {
    currentIndex = 1;
  }

  const steps: ReturnTrackingStep[] = [
    { id: 'requested', labelKey: 'RETURNS.STEP_REQUESTED', done: false, current: false },
    { id: 'review', labelKey: 'RETURNS.STEP_REVIEW', done: false, current: false },
    { id: 'approved', labelKey: 'RETURNS.STEP_APPROVED', done: false, current: false },
    { id: 'refunded', labelKey: 'RETURNS.STEP_REFUNDED', done: false, current: false },
  ];

  return steps.map((step, index) => ({
    ...step,
    done: isRejected ? index <= 1 : index < currentIndex,
    current: isRejected ? index === 1 : index === currentIndex,
  }));
}
