export type EcCouponDiscountType = 'FixedAmount' | 'Percentage' | string;

export interface EcCouponDto {
  id: number;
  code: string;
  nameAr?: string | null;
  nameEn?: string | null;
  discountType: EcCouponDiscountType;
  discountValue: number;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  usedCount?: number;
  minimumOrderAmount?: number | null;
  isActive: boolean;
}

export interface EcCouponsPagedResult {
  totalCount: number;
  items: EcCouponDto[];
}
