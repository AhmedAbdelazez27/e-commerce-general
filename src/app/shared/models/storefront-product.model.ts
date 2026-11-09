import type { ProductStock } from './product-stock.model';
/**
 * Catalog/home DTO shape — map to `ProductCardData` via `mapStorefrontProductToCardData`.
 * Keeps bilingual names for API alignment.
 */
export interface StorefrontProduct {
  stock?: ProductStock;
  id: number;
  productVariantId?: number | null;
  slug?: string;
  nameEn: string;
  nameAr: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  has3D?: boolean;
  reviewCount?: number;
  rating?: number;
  discountPercent?: number;
  brandName?: string;
  isAvailable?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  currencyCode?: string;
  offers?: PublicOfferBadge[];
}
import type { PublicOfferBadge } from './promotion.model';
