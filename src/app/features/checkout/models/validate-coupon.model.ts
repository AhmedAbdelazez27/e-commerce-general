export interface ValidateCouponRequest {
  couponCode: string;
  totalOrder: number;
  customerId: number;
}

export interface ValidateCouponResultDto {
  validDate: string;
  isActive: number;
  usageLimit: number | null;
  discountAmount: number;
  validAmount: string;
  remainingAmountToBeUsed: number;
}
