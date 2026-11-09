import type { ProductStock } from './product-stock.model';
/** Data contract for `app-product-card`. */
export interface ProductCardData {
  stock?: ProductStock;
  id: number;
  /** Optional explicitly selected model; plain products use null. */
  productVariantId?: number | null;
  wishlistItemId?: number;
  variantNameAr?: string;
  quantity?: number;
  availabilityStatus?: import('./product-stock.model').AvailabilityStatus;
  slug?: string;
  title: string;
  /** Optional Arabic title; used when `LanguageService` is `ar`. */
  titleAr?: string;
  /** Optional exact purchasable variant identity for variant-level listings. */
  variantName?: string;
  variantSku?: string;
  brand?: string;
  image?: string;
  has3D?: boolean;
  price: number;
  oldPrice?: number;
  discountPercentage?: number;
  /** 0–5 scale */
  rating?: number;
  reviewsCount?: number;
  isAvailable?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  currency?: string;
  offers?: PublicOfferBadge[];
}
import type { PublicOfferBadge } from './promotion.model';
