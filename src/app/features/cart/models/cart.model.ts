export interface CartItemDto {
  CartDetailId?: number;
  ProductId: number;
  ProductVariantId?: number;
  ProductName?: string;
  VariantSku?: string;
  Quantity: number;
  UnitPrice: number;
  LineTotal?: number;
  DiscountAmount?: number;
}

/** Shared customer/session context for EcCart operations. */
export interface EcCartContextRequest {
  customerId: number;
  sessionId: string | null;
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

export interface AddCartItemRequest {
  ProductId: number;
  Quantity: number;
}

export interface UpdateCartItemRequest {
  ProductId: number;
  Quantity: number;
}
