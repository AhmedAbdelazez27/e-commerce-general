import { AppLang } from '../../../core/services/language.service';
import { ProductCardData } from '../../../shared/models/product-card.model';
import { CatalogBreadcrumbItem } from '../models/catalog-listing.model';
import { ProductDetail } from '../models/product-detail.model';
import { mapCatalogProductToCardData } from './catalog-product.mapper';
import { CatalogListingProduct } from '../models/catalog-listing.model';
import { productHasOffer } from './catalog-listing-filter.util';

export function localizedProductName(product: ProductDetail, lang: AppLang): string {
  return lang === 'ar' ? product.nameAr : product.nameEn;
}

export function localizedBrandName(product: ProductDetail, lang: AppLang): string {
  return lang === 'ar' ? product.brandNameAr : product.brandNameEn;
}

export function localizedCategoryName(product: ProductDetail, lang: AppLang): string {
  return lang === 'ar' ? product.categoryNameAr : product.categoryNameEn;
}

export function productDetailDiscountPercent(product: ProductDetail): number | null {
  if (product.discountPercent != null && product.discountPercent > 0) {
    return Math.round(product.discountPercent);
  }
  if (product.compareAtPrice != null && product.compareAtPrice > product.price) {
    return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
  }
  return null;
}

export function buildProductDetailBreadcrumbs(product: ProductDetail): CatalogBreadcrumbItem[] {
  const categoryQuery: Record<string, string> = { categoryId: product.categoryId };
  if (product.categorySlug) {
    categoryQuery['category'] = product.categorySlug;
  }

  return [
    { labelKey: 'PAGE.HOME', route: '/home' },
    { labelKey: 'PAGE.SHOP', route: '/shop' },
    {
      labelEn: product.categoryNameEn,
      labelAr: product.categoryNameAr,
      route: '/shop',
      queryParams: categoryQuery,
    },
    {
      labelEn: product.nameEn,
      labelAr: product.nameAr,
      current: true,
    },
  ];
}

export function mapRelatedToCardData(related: CatalogListingProduct[]): ProductCardData[] {
  return related.map((p) => mapCatalogProductToCardData(p));
}

export function listingProductHasOffer(product: CatalogListingProduct): boolean {
  return productHasOffer(product);
}
