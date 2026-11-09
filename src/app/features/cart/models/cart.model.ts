import type { OfferGuidance } from '../../../shared/models/promotion.model';

export interface CartItemDto {
  PendingSync?: { customerId: number; targetQuantity: number };
  CartDetailId?: number;
  ProductId: number;
  ProductVariantId?: number | null;
  ProductName?: string;
  ProductNameAr?: string;
  ProductNameEn?: string;
  VariantName?: string;
  VariantNameAr?: string;
  VariantNameEn?: string;
  VariantSku?: string;
  ProductImageUrl?: string;
  ProductVariantImageUrl?: string;
  ImageUrl?: string;
  HasModel3D?: boolean;
  Quantity: number;
  UnitPrice: number;
  FinalPrice?: number;
  LineTotal?: number;
  DiscountAmount?: number;
  SelectedReward?: boolean;
  ProductDiscountTotal?: number;
  BundleDiscountTotal?: number;
  CouponDiscountTotal?: number;
  BundleUsedQuantity?: number;
  RewardQuantity?: number;
}

/** Shared customer/session context for EcCart operations. */
export interface EcCartContextRequest {
  customerId: number;
  /** Empty string for logged-in carts; guest carts use a stable UUID string. */
  sessionId: string;
  couponCode: string | null;
  currencyId?: number;
  currencyCode?: string;
}

/** Body for `EcCart/AddToCart` (camelCase per API contract). */
export interface EcAddToCartRequest extends EcCartContextRequest {
  productId: number;
  productVariantId: number | null;
  quantity: number;
  selectedReward?: boolean | null;
}

/** Body for `EcCart/UpdateCart` (PUT). */
export interface EcUpdateCartRequest extends EcCartContextRequest {
  cartDetailId: number;
  quantity: number;
  selectedReward?: boolean | null;
}

export interface CartDto {
  CartId?: number;
  Items: CartItemDto[];
  SubTotal?: number;
  Total?: number;
  CouponCode?: string;
  CouponDiscountAmount?: number;
  DiscountAmount?: number;
  CurrencyId?: number;
  CurrencyCode?: string;
  CurrencyNameAr?: string;
  CurrencyNameEn?: string;
  TotalAmount?: number;
  ProductDiscountAmount?: number;
  BundleDiscountAmount?: number;
  AppliedBundleId?: number;
  AppliedBundleCode?: string;
  AppliedBundleNameAr?: string;
  AppliedBundleNameEn?: string;
  AppliedBundleApplications?: number;
  PromotionWarnings?: string[];
  TaxAmount?: number;
  ItemsCount?: number;
  OfferGuidance?: OfferGuidance[];
  /** Internal compatibility marker: the deployed API returned the additive promotion contract. */
  SupportsPromotionPricing?: boolean;
}

/** Product snapshot stored with guest cart lines (no API). */
export interface GuestCartProductMeta {
  productId: number;
  productNameEn: string;
  productNameAr: string;
  imageUrl?: string;
  has3D?: boolean;
  unitPrice: number;
  isAvailable?: boolean;
  variantName?: string;
  variantSku?: string;
}

export interface AddCartItemRequest {
  ProductId: number;
  Quantity: number;
}

export interface UpdateCartItemRequest {
  ProductId: number;
  Quantity: number;
}
