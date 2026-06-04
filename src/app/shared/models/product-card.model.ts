/** Data contract for `app-product-card`. */
export interface ProductCardData {
  id: number;
  /** Default variant for `EcCart/AddToCart`. */
  productVariantId?: number;
  slug?: string;
  title: string;
  /** Optional Arabic title; used when `LanguageService` is `ar`. */
  titleAr?: string;
  brand?: string;
  image?: string;
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
}
