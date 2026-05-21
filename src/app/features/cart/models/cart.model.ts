export interface CartItemDto {
  ProductId: number;
  ProductName?: string;
  Quantity: number;
  UnitPrice: number;
  LineTotal?: number;
}

export interface CartDto {
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
