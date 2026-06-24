import type { AppLang } from '../../../core/services/language.service';
import type { CurrencySelection } from '../../../core/models/currency.model';
import { mapSearchProductToListingProduct } from '../../catalog/utils/catalog-listing-api.mapper';
import {
  PublicSearchProductDto,
  SearchProductsRequest,
} from '../../catalog/models/catalog-public-listing.model';
import { StorefrontProduct } from '../../../shared/models/storefront-product.model';
import { HomeProductSectionSearchFilter } from '../models/home.model';

/** Home product rails/grids never request or show more than this many items. */
export const HOME_PRODUCT_SECTION_MAX_ITEMS = 8;

export function resolveHomeProductSectionLimit(maxItems?: number): number {
  const requested = maxItems != null && maxItems > 0 ? maxItems : HOME_PRODUCT_SECTION_MAX_ITEMS;
  return Math.min(requested, HOME_PRODUCT_SECTION_MAX_ITEMS);
}

export function buildHomeProductSearchRequest(
  filter: HomeProductSectionSearchFilter,
  lang: string,
  currency: CurrencySelection,
  maxResultCount?: number,
): SearchProductsRequest {
  const request: SearchProductsRequest = {
    lang,
    sortBy: 'newest',
    includeChildrenCategories: true,
    skipCount: 0,
    maxResultCount: resolveHomeProductSectionLimit(maxResultCount),
    currencyId: currency.id,
    currencyCode: currency.code,
  };

  if (filter.isNewArrival) {
    request.isNewArrival = true;
  }
  if (filter.isBestSeller) {
    request.isBestSeller = true;
  }
  if (filter.isFeatured) {
    request.isFeatured = true;
  }

  return request;
}

export function mapSearchProductToStorefrontProduct(
  item: PublicSearchProductDto,
  lang: AppLang,
): StorefrontProduct {
  const listing = mapSearchProductToListingProduct(item, lang);

  return {
    id: listing.id,
    productVariantId: listing.productVariantId,
    slug: listing.slug,
    nameEn: listing.nameEn,
    nameAr: listing.nameAr,
    price: listing.price,
    compareAtPrice: listing.compareAtPrice,
    imageUrl: listing.imageUrl,
    discountPercent: listing.discountPercent,
    brandName: listing.brandNameEn,
    isAvailable: listing.isAvailable,
    isNew: listing.isNew,
    isBestSeller: listing.isBestSeller,
    currencyCode: listing.currencyCode,
  };
}
