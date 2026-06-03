import { AppLang } from '../../../core/services/language.service';
import {
  CatalogBrandOption,
  CatalogCategoryOption,
  CatalogListingFilters,
  CatalogListingProduct,
  CatalogSortOption,
  CatalogSpecificationGroup,
} from '../models/catalog-listing.model';
import {
  GetProductFiltersParams,
  GetProductFiltersResult,
  PublicSearchProductDto,
  PublicSpecificationFilterDto,
  SearchProductsRequest,
} from '../models/catalog-public-listing.model';

export const CATALOG_PAGE_SIZE = 20;

const SORT_BY_MAP: Record<CatalogSortOption, string> = {
  featured: 'featured',
  'price-asc': 'priceAsc',
  'price-desc': 'priceDesc',
  newest: 'newest',
  rating: 'rating',
  name: 'name',
};

function parseNumericIds(ids: string[]): number[] {
  return ids.map(Number).filter((id) => Number.isFinite(id) && id > 0);
}

function primaryCategoryId(filters: CatalogListingFilters): number | undefined {
  const ids = parseNumericIds(filters.categoryIds);
  return ids[0];
}

/** Maps sidebar spec selections to the backend SearchProducts / GetProductFilters shape. */
export function toApiSpecificationFilters(
  filters: CatalogListingFilters,
): PublicSpecificationFilterDto[] {
  return filters.specificationSelections
    .filter((selection) => selection.values.length > 0)
    .map((selection) => ({
      specificationTypeId: selection.specificationId,
      values: selection.values,
    }));
}

interface SharedListingParams {
  categoryId?: number;
  brandIds?: number[];
  searchText?: string;
  minPrice?: number;
  maxPrice?: number;
  lang: string;
  includeChildrenCategories: boolean;
  specificationFilters?: PublicSpecificationFilterDto[];
}

function buildSharedListingParams(
  filters: CatalogListingFilters,
  searchQuery: string,
  lang: string,
): SharedListingParams {
  const brandIds = parseNumericIds(filters.brandIds);
  const categoryId = primaryCategoryId(filters);
  const searchText = searchQuery.trim();
  const specificationFilters = toApiSpecificationFilters(filters);

  const params: SharedListingParams = {
    lang,
    includeChildrenCategories: true,
  };

  if (categoryId != null) {
    params.categoryId = categoryId;
  }
  if (brandIds.length > 0) {
    params.brandIds = brandIds;
  }
  if (filters.minPrice != null) {
    params.minPrice = filters.minPrice;
  }
  if (filters.maxPrice != null) {
    params.maxPrice = filters.maxPrice;
  }
  if (searchText) {
    params.searchText = searchText;
  }
  if (specificationFilters.length > 0) {
    params.specificationFilters = specificationFilters;
  }

  return params;
}

export function buildGetProductFiltersParams(
  filters: CatalogListingFilters,
  searchQuery: string,
  lang: string,
): GetProductFiltersParams {
  return buildSharedListingParams(filters, searchQuery, lang);
}

/** Builds a sparse body — no zero/null defaults that would widen the search. */
export function buildSearchProductsRequest(
  filters: CatalogListingFilters,
  searchQuery: string,
  lang: string,
  sort: CatalogSortOption,
  skipCount: number,
  maxResultCount = CATALOG_PAGE_SIZE,
): SearchProductsRequest {
  const shared = buildSharedListingParams(filters, searchQuery, lang);
  const request: SearchProductsRequest = {
    includeChildrenCategories: shared.includeChildrenCategories,
    lang: shared.lang,
    sortBy: SORT_BY_MAP[sort] ?? 'newest',
    skipCount,
    maxResultCount: maxResultCount > 0 ? maxResultCount : CATALOG_PAGE_SIZE,
  };

  if (shared.categoryId != null) {
    request.categoryId = shared.categoryId;
  }
  if (shared.brandIds?.length) {
    request.brandIds = shared.brandIds;
    if (shared.brandIds.length === 1) {
      request.brandId = shared.brandIds[0];
    }
  }
  if (shared.minPrice != null) {
    request.minPrice = shared.minPrice;
  }
  if (shared.maxPrice != null) {
    request.maxPrice = shared.maxPrice;
  }
  if (shared.searchText) {
    request.searchText = shared.searchText;
  }
  if (shared.specificationFilters?.length) {
    request.specificationFilters = shared.specificationFilters;
  }

  return request;
}

export function mapFilterSpecificationsToGroups(
  specifications: GetProductFiltersResult['specifications'],
): CatalogSpecificationGroup[] {
  return specifications.map((spec) => ({
    id: spec.id,
    nameEn: spec.nameEn || spec.name,
    nameAr: spec.nameAr || spec.name,
    code: spec.code,
    options: spec.options.map((option) => ({
      value: option.value,
      displayValue: option.displayValue,
      count: option.count,
    })),
  }));
}

export function mapFilterCategoriesToOptions(
  categories: GetProductFiltersResult['categories'],
): CatalogCategoryOption[] {
  return categories.map((category) => ({
    id: String(category.id),
    slug: category.slug,
    nameEn: category.name,
    nameAr: category.name,
    count: category.count,
  }));
}

export function mapFilterBrandsToOptions(
  brands: GetProductFiltersResult['brands'],
): CatalogBrandOption[] {
  return brands.map((brand) => ({
    id: String(brand.id),
    nameEn: brand.name,
    nameAr: brand.name,
    count: brand.count,
  }));
}

export function mapSearchProductToListingProduct(
  item: PublicSearchProductDto,
  _lang: AppLang,
): CatalogListingProduct {
  const inStock = item.availabilityStatus === 'InStock';
  const nameEn = item.nameEn?.trim() || item.name;
  const nameAr = item.nameAr?.trim() || item.name;

  return {
    id: item.productId ?? item.id,
    slug: item.slug,
    nameEn,
    nameAr,
    price: item.finalPrice,
    compareAtPrice: item.oldPrice ?? undefined,
    categoryId: String(item.categoryId),
    categoryNameEn: item.categoryName,
    categoryNameAr: item.categoryName,
    brandId: item.brandId != null ? String(item.brandId) : '',
    brandNameEn: item.brandName ?? '',
    brandNameAr: item.brandName ?? '',
    isAvailable: inStock,
    isNew: item.isNewArrival,
    isBestSeller: item.isBestSeller,
    isFeatured: item.isFeatured,
    hasOffer:
      (item.discountPercent != null && item.discountPercent > 0) ||
      (item.oldPrice != null && item.oldPrice > item.finalPrice),
    discountPercent: item.discountPercent ?? undefined,
    imageUrl: item.mainImageUrl ?? undefined,
    createdAt: '',
  };
}

export function mapSearchProductsToListingProducts(
  items: PublicSearchProductDto[],
  lang: AppLang,
): CatalogListingProduct[] {
  return items.map((item) => mapSearchProductToListingProduct(item, lang));
}
