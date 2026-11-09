export type CartCouponStatus = 'idle' | 'applied' | 'invalid' | 'loading';

export interface CartLineItemView {
  availabilityStatus?: string;
  serialQuantity?: boolean;
  cartDetailId: number;
  productId: number;
  productVariantId?: number | null;
  titleEn: string;
  titleAr: string;
  brandEn: string;
  brandAr: string;
  unitPrice: number;
  compareAtUnitPrice?: number;
  discountPercent?: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string;
  has3D?: boolean;
  isAvailable: boolean;
  maxQuantity: number;
  selectedReward: boolean;
  productDiscountTotal: number;
  offerDiscountTotal: number;
  couponDiscountTotal: number;
  bundleUsedQuantity: number;
  rewardQuantity: number;
  canSelectReward?: boolean;
}

export interface CartOrderSummaryView {
  subtotal: number;
  productDiscount: number;
  couponDiscount: number;
  offerDiscount: number;
  taxAmount: number;
  discount: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  isFreeDelivery: boolean;
}

export interface CartCouponState {
  status: CartCouponStatus;
  code: string;
  appliedCode?: string;
  messageKey?: string;
  messageParams?: Record<string, string | number>;
}
