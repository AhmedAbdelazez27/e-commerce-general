import type { CartDto, CartItemDto, GuestCartProductMeta } from '../models/cart.model';

export const GUEST_CART_STORAGE_KEY = 'guest_cart';

export function readGuestCartFromStorage(): CartDto | null {
  try {
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartDto) : null;
  } catch {
    return null;
  }
}

export function writeGuestCartToStorage(cart: CartDto): void {
  try {
    localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // ignore quota / private mode
  }
}

export function clearGuestCartStorage(): void {
  localStorage.removeItem(GUEST_CART_STORAGE_KEY);
}

export function nextGuestCartDetailId(items: CartItemDto[]): number {
  const max = items.reduce((highest, item) => Math.max(highest, item.CartDetailId ?? 0), 0);
  return max + 1;
}

export function buildGuestCartItem(
  meta: GuestCartProductMeta,
  productVariantId: number,
  quantity: number,
  cartDetailId: number,
): CartItemDto {
  const unitPrice = meta.unitPrice;
  return {
    CartDetailId: cartDetailId,
    ProductId: meta.productId,
    ProductVariantId: productVariantId,
    ProductNameEn: meta.productNameEn,
    ProductNameAr: meta.productNameAr,
    ImageUrl: meta.imageUrl,
    ProductImageUrl: meta.imageUrl,
    Quantity: quantity,
    UnitPrice: unitPrice,
    FinalPrice: unitPrice,
    LineTotal: unitPrice * quantity,
  };
}

export function recalcGuestCart(items: CartItemDto[]): CartDto {
  const normalized = items.map((item) => {
    const unitPrice = item.FinalPrice ?? item.UnitPrice ?? 0;
    const quantity = Math.max(0, item.Quantity ?? 0);
    return {
      ...item,
      UnitPrice: unitPrice,
      FinalPrice: unitPrice,
      LineTotal: unitPrice * quantity,
    };
  });

  const subtotal = normalized.reduce((sum, item) => sum + (item.LineTotal ?? 0), 0);
  return {
    Items: normalized,
    SubTotal: subtotal,
    Total: subtotal,
  };
}
