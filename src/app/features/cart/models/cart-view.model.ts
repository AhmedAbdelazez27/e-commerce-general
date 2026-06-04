export type CartCouponStatus = 'idle' | 'applied' | 'invalid';

export interface CartCouponDefinition {
  code: string;
  percentOff: number;
  labelKey: string;
}

export interface CartLineItemView {
  cartDetailId: number;
  productId: number;
  productVariantId?: number;
  titleEn: string;
  titleAr: string;
  brandEn: string;
  brandAr: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string;
  isAvailable: boolean;
  maxQuantity: number;
}

export interface CartOrderSummaryView {
  subtotal: number;
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
}
