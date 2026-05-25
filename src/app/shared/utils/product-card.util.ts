import { AppLang } from '../../core/services/language.service';
import { ProductCardData } from '../models/product-card.model';
import { StorefrontProduct } from '../models/storefront-product.model';

export function resolveDiscountFromCompare(
  price: number,
  compareAtPrice?: number | null,
): number | undefined {
  if (compareAtPrice != null && compareAtPrice > price) {
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  }
  return undefined;
}

export function resolveProductCardTitle(product: ProductCardData, lang: AppLang): string {
  return lang === 'ar' && product.titleAr ? product.titleAr : product.title;
}

export function resolveProductCardDiscount(data: ProductCardData): number | null {
  if (data.discountPercentage != null && data.discountPercentage > 0) {
    return Math.round(data.discountPercentage);
  }
  if (data.oldPrice != null && data.oldPrice > data.price) {
    return Math.round(((data.oldPrice - data.price) / data.oldPrice) * 100);
  }
  return null;
}

export function productCardHasDiscount(data: ProductCardData): boolean {
  return resolveProductCardDiscount(data) != null;
}

export function mapStorefrontProductToCardData(
  product: StorefrontProduct,
  options?: { currency?: string },
): ProductCardData {
  const discountFromCompare = resolveDiscountFromCompare(product.price, product.compareAtPrice);

  return {
    id: product.id,
    title: product.nameEn,
    titleAr: product.nameAr,
    brand: product.brandName,
    image: product.imageUrl,
    price: product.price,
    oldPrice: product.compareAtPrice,
    discountPercentage: product.discountPercent ?? discountFromCompare,
    rating: product.rating,
    reviewsCount: product.reviewCount,
    isAvailable: product.isAvailable ?? true,
    isNew: product.isNew ?? false,
    isBestSeller: product.isBestSeller ?? false,
    currency: options?.currency,
  };
}

export function formatProductPrice(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

/** Five star slots filled when rating meets each step (0.75 threshold). */
export function productCardStarSlots(rating: number | undefined): boolean[] {
  return [0, 1, 2, 3, 4].map((i) => {
    if (rating == null) {
      return false;
    }
    return rating >= i + 0.75;
  });
}
