export interface CartItemDto {
  CartDetailId?: number;
  ProductId: number;
  ProductVariantId?: number;
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
  Quantity: number;
  UnitPrice: number;
  FinalPrice?: number;
  LineTotal?: number;
  DiscountAmount?: number;
}

/** Shared customer/session context for EcCart operations. */
export interface EcCartContextRequest {
  customerId: number;
  /** Empty string for logged-in carts; guest carts use a stable UUID string. */
  sessionId: string;
  couponCode: string | null;
}

/** Body for `EcCart/AddToCart` (camelCase per API contract). */
export interface EcAddToCartRequest extends EcCartContextRequest {
  productVariantId: number;
  quantity: number;
}

/** Body for `EcCart/UpdateCart` (PUT). */
export interface EcUpdateCartRequest extends EcCartContextRequest {
  cartDetailId: number;
  quantity: number;
}

export interface CartDto {
  CartId?: number;
  Items: CartItemDto[];
  SubTotal?: number;
  Total?: number;
}

/** Product snapshot stored with guest cart lines (no API). */
export interface GuestCartProductMeta {
  productId: number;
  productNameEn: string;
  productNameAr: string;
  imageUrl?: string;
  unitPrice: number;
  isAvailable?: boolean;
}

export interface AddCartItemRequest {
  ProductId: number;
  Quantity: number;
}

export interface UpdateCartItemRequest {
  ProductId: number;
  Quantity: number;
}
