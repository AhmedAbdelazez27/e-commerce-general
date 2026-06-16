import type { StorefrontProduct } from '../../../shared/models/storefront-product.model';

export interface EcWishlistCommand {
  productVariantId: number;
  customerId: number;
}

/** Best-effort normalized item for UI. */
export type EcWishlistItem = StorefrontProduct & {
  /** Variant id used by wishlist/cart endpoints. */
  productVariantId: number;
};

