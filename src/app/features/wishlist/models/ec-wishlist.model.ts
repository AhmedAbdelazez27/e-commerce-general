import type { StorefrontProduct } from '../../../shared/models/storefront-product.model';

/** Shared customer/currency context for EcWishlist operations. */
export interface EcWishlistContextRequest {
  customerId: number;
  currencyId?: number;
  currencyCode?: string;
}

export interface EcWishlistCommand extends EcWishlistContextRequest {
  productVariantId: number;
}

export interface EcWishlistDto {
  CurrencyId?: number;
  CurrencyCode?: string;
  CurrencyNameAr?: string;
  CurrencyNameEn?: string;
  CurrencyRate?: number;
  LocalCurrencyId?: number;
  LocalCurrencyCode?: string;
  Items: EcWishlistItem[];
}

/** Best-effort normalized item for UI. */
export type EcWishlistItem = StorefrontProduct & {
  /** Variant id used by wishlist/cart endpoints. */
  productVariantId: number;
};
