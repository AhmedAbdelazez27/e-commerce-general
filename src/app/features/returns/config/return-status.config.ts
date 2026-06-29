export type ReturnStatusKind = 'under_review' | 'accepted' | 'rejected';

export interface ReturnStatusDefinition {
  kind: ReturnStatusKind;
  lkpId: number;
  nameEn: string;
  nameAr: string;
  labelKey: string;
  chipClass: string;
}

export const RETURN_STATUSES: ReturnStatusDefinition[] = [
  {
    kind: 'under_review',
    lkpId: 42135,
    nameEn: 'Under review',
    nameAr: 'تحت المراجعة',
    labelKey: 'RETURNS.STATUS_UNDER_REVIEW',
    chipClass: 'returns-page__status-chip--review',
  },
  {
    kind: 'rejected',
    lkpId: 42136,
    nameEn: 'Rejected',
    nameAr: 'تم الرفض',
    labelKey: 'RETURNS.STATUS_REJECTED',
    chipClass: 'returns-page__status-chip--rejected',
  },
  {
    kind: 'accepted',
    lkpId: 42137,
    nameEn: 'Accepted',
    nameAr: 'مقبول',
    labelKey: 'RETURNS.STATUS_ACCEPTED',
    chipClass: 'returns-page__status-chip--accepted',
  },
];

const BY_LKP_ID = new Map(RETURN_STATUSES.map((status) => [status.lkpId, status]));

const BY_KIND = new Map(RETURN_STATUSES.map((status) => [status.kind, status]));

export function returnStatusByLkpId(lkpId: number | undefined): ReturnStatusDefinition | null {
  if (lkpId == null) {
    return null;
  }
  return BY_LKP_ID.get(lkpId) ?? null;
}

export function returnStatusByKind(kind: ReturnStatusKind): ReturnStatusDefinition {
  return BY_KIND.get(kind)!;
}
