import { normalizeStatusToken } from '../../account/utils/account-order.util';
import type { EcOrderDto } from '../../checkout/models/place-order.model';
import {
  RETURN_STATUSES,
  type ReturnStatusDefinition,
  type ReturnStatusKind,
  returnStatusByLkpId,
} from '../config/return-status.config';
import type { EcReturnDto, ReturnListFilter } from '../models/return.model';

export interface ReturnTrackingStep {
  id: string;
  labelKey: string;
  done: boolean;
  current: boolean;
  tone?: 'default' | 'success' | 'danger';
}

const ELIGIBLE_ORDER_STATUSES = new Set(['delivered', 'completed', 'closed']);

const STATUS_TOKEN_MAP: Record<string, ReturnStatusKind> = {
  underreview: 'under_review',
  review: 'under_review',
  reviewing: 'under_review',
  pending: 'under_review',
  processing: 'under_review',
  submitted: 'under_review',
  rejected: 'rejected',
  declined: 'rejected',
  accepted: 'accepted',
  approved: 'accepted',
  completed: 'accepted',
};

export function canRequestReturnForOrder(order: EcOrderDto): boolean {
  const tokens = [order.orderStatus, order.shippingStatus].map(normalizeStatusToken);
  if (tokens.some((status) => ['cancelled', 'canceled', 'refunded'].includes(status))) {
    return false;
  }
  return tokens.some((status) => ELIGIBLE_ORDER_STATUSES.has(status));
}

export function resolveReturnStatus(ret: EcReturnDto): ReturnStatusDefinition | null {
  const byLkp = returnStatusByLkpId(ret.returnStatusLkpId);
  if (byLkp) {
    return byLkp;
  }

  const token = returnStatusToken(ret);
  const kind = STATUS_TOKEN_MAP[token];
  if (!kind) {
    return null;
  }

  return RETURN_STATUSES.find((status) => status.kind === kind) ?? null;
}

export function resolveReturnStatusKind(ret: EcReturnDto): ReturnStatusKind | null {
  return resolveReturnStatus(ret)?.kind ?? null;
}

export function isUnderReviewReturn(ret: EcReturnDto): boolean {
  return resolveReturnStatusKind(ret) === 'under_review';
}

export function isAcceptedReturn(ret: EcReturnDto): boolean {
  return resolveReturnStatusKind(ret) === 'accepted';
}

export function isRejectedReturn(ret: EcReturnDto): boolean {
  return resolveReturnStatusKind(ret) === 'rejected';
}

export function filterReturns(items: EcReturnDto[], filter: ReturnListFilter): EcReturnDto[] {
  if (filter === 'all') {
    return items;
  }

  return items.filter((ret) => resolveReturnStatusKind(ret) === filter);
}

export function returnStatusToken(ret: EcReturnDto): string {
  return normalizeStatusToken(ret.returnStatusNameEn ?? ret.returnStatusNameAr);
}

export function returnStatusDisplayName(ret: EcReturnDto, isArabic: boolean): string {
  const resolved = resolveReturnStatus(ret);
  if (resolved) {
    return isArabic ? resolved.nameAr : resolved.nameEn;
  }

  const localized = isArabic ? ret.returnStatusNameAr : ret.returnStatusNameEn;
  if (localized?.trim()) {
    return localized.trim();
  }

  const fallback = isArabic ? ret.returnStatusNameEn : ret.returnStatusNameAr;
  return fallback?.trim() ?? '';
}

export function returnStatusChipClass(ret: EcReturnDto): string {
  return resolveReturnStatus(ret)?.chipClass ?? 'returns-page__status-chip--review';
}

export function hasActiveReturnForOrderDetail(
  returns: EcReturnDto[],
  orderDetailId: number | undefined,
): boolean {
  if (orderDetailId == null) {
    return false;
  }
  return returns.some((ret) => ret.orderDetailId === orderDetailId && isUnderReviewReturn(ret));
}

export function returnTrackingSteps(ret: EcReturnDto): ReturnTrackingStep[] {
  const kind = resolveReturnStatusKind(ret);

  const decisionLabelKey =
    kind === 'accepted'
      ? 'RETURNS.STEP_ACCEPTED'
      : kind === 'rejected'
        ? 'RETURNS.STEP_REJECTED'
        : 'RETURNS.STEP_DECISION';

  const decisionTone: ReturnTrackingStep['tone'] =
    kind === 'accepted' ? 'success' : kind === 'rejected' ? 'danger' : 'default';

  const steps: ReturnTrackingStep[] = [
    {
      id: 'submitted',
      labelKey: 'RETURNS.STEP_SUBMITTED',
      done: true,
      current: false,
    },
    {
      id: 'under_review',
      labelKey: 'RETURNS.STATUS_UNDER_REVIEW',
      done: kind === 'accepted' || kind === 'rejected',
      current: kind === 'under_review',
    },
    {
      id: 'decision',
      labelKey: decisionLabelKey,
      done: kind === 'accepted' || kind === 'rejected',
      current: kind === 'accepted' || kind === 'rejected',
      tone: decisionTone,
    },
  ];

  return steps;
}
