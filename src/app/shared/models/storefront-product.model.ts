/**
 * Catalog/home DTO shape — map to `ProductCardData` via `mapStorefrontProductToCardData`.
 * Keeps bilingual names for API alignment.
 */
export interface StorefrontProduct {
  id: number;
  productVariantId?: number;
  slug?: string;
  nameEn: string;
  nameAr: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  reviewCount?: number;
  rating?: number;
  discountPercent?: number;
  brandName?: string;
  isAvailable?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
}
