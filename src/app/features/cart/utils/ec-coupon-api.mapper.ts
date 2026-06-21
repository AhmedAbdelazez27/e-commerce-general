import { EcCouponDto, EcCouponsPagedResult } from '../models/ec-coupon.model';

type JsonRecord = Record<string, unknown>;

function readString(o: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readNumber(o: JsonRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function readBool(o: JsonRecord, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return false;
}

export function normalizeEcCouponDto(raw: unknown): EcCouponDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const o = raw as JsonRecord;
  const id = readNumber(o, 'id', 'Id');
  const code = readString(o, 'code', 'Code');
  if (id == null || !code) {
    return null;
  }

  return {
    id,
    code,
    nameAr: readString(o, 'nameAr', 'NameAr') ?? null,
    nameEn: readString(o, 'nameEn', 'NameEn') ?? null,
    discountType: readString(o, 'discountType', 'DiscountType') ?? 'FixedAmount',
    discountValue: readNumber(o, 'discountValue', 'DiscountValue') ?? 0,
    startDate: readString(o, 'startDate', 'StartDate') ?? null,
    endDate: readString(o, 'endDate', 'EndDate') ?? null,
    usageLimit: readNumber(o, 'usageLimit', 'UsageLimit') ?? null,
    usedCount: readNumber(o, 'usedCount', 'UsedCount') ?? 0,
    minimumOrderAmount: readNumber(o, 'minimumOrderAmount', 'MinimumOrderAmount') ?? null,
    isActive: readBool(o, 'isActive', 'IsActive'),
  };
}

export function normalizeEcCouponsPagedResult(raw: unknown): EcCouponsPagedResult {
  if (raw == null || typeof raw !== 'object') {
    return { totalCount: 0, items: [] };
  }

  const o = raw as JsonRecord;
  const itemsRaw = o['items'] ?? o['Items'];
  const items = Array.isArray(itemsRaw)
    ? itemsRaw
        .map((item) => normalizeEcCouponDto(item))
        .filter((item): item is EcCouponDto => item != null)
    : [];

  return {
    totalCount: readNumber(o, 'totalCount', 'TotalCount') ?? items.length,
    items,
  };
}
