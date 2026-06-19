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
  PublicSearchProductPriceDto,
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
  lang: AppLang,
): CatalogListingProduct {
  const availability = item.availabilityStatus?.trim() || item.availableStatus?.trim();
  const inStock = availability === 'InStock';
  const nameEn = item.nameEn?.trim() || item.name;
  const nameAr = item.nameAr?.trim() || item.name;
  const finalPrice = item.finalPrice ?? item.price?.finalPrice ?? 0;
  const imageUrl = item.mainImageUrl?.trim() || undefined;

  return {
    id: item.productId ?? item.id,
    productVariantId: item.price?.productVariantId,
    slug: item.slug,
    nameEn,
    nameAr,
    price: finalPrice,
    compareAtPrice: item.oldPrice ?? undefined,
    categoryId: String(item.categoryId),
    categoryNameEn: item.categoryNameEn?.trim() || item.categoryName,
    categoryNameAr: item.categoryNameAr?.trim() || item.categoryName,
    brandId: item.brandId != null ? String(item.brandId) : '',
    brandNameEn: item.brandNameEn?.trim() || item.brandName?.trim() || '',
    brandNameAr: item.brandNameAr?.trim() || item.brandName?.trim() || '',
    isAvailable: inStock,
    isNew: item.isNewArrival,
    isBestSeller: item.isBestSeller,
    isFeatured: item.isFeatured,
    hasOffer:
      (item.discountPercent != null && item.discountPercent > 0) ||
      (item.oldPrice != null && item.oldPrice > finalPrice),
    discountPercent: item.discountPercent ?? undefined,
    imageUrl,
    createdAt: '',
  };
}

export function mapSearchProductsToListingProducts(
  items: PublicSearchProductDto[],
  lang: AppLang,
): CatalogListingProduct[] {
  return items.map((item) => mapSearchProductToListingProduct(item, lang));
}

type JsonRecord = Record<string, unknown>;

function readStringField(o: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readNumberField(o: JsonRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function readBoolField(o: JsonRecord, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return false;
}

function normalizeSearchProductPrice(raw: unknown): PublicSearchProductPriceDto | undefined {
  if (raw == null || typeof raw !== 'object') {
    return undefined;
  }
  const o = raw as JsonRecord;
  const productVariantId = readNumberField(o, 'productVariantId', 'ProductVariantId');
  if (productVariantId == null) {
    return undefined;
  }

  return {
    productVariantId,
    basePrice: readNumberField(o, 'basePrice', 'BasePrice') ?? 0,
    customerPrice: readNumberField(o, 'customerPrice', 'CustomerPrice') ?? 0,
    discountAmount: readNumberField(o, 'discountAmount', 'DiscountAmount') ?? 0,
    couponDiscountAmount:
      readNumberField(o, 'couponDiscountAmount', 'CouponDiscountAmount') ?? 0,
    taxAmount: readNumberField(o, 'taxAmount', 'TaxAmount') ?? 0,
    finalPrice: readNumberField(o, 'finalPrice', 'FinalPrice') ?? 0,
  };
}

/** Normalizes ABP SearchProducts items (camelCase or PascalCase) into a stable DTO. */
export function normalizePublicSearchProductDto(raw: unknown): PublicSearchProductDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const o = raw as JsonRecord;
  const id = readNumberField(o, 'id', 'Id');
  const productId = readNumberField(o, 'productId', 'ProductId') ?? id;
  if (id == null && productId == null) {
    return null;
  }

  const price = normalizeSearchProductPrice(o['price'] ?? o['Price']);
  const finalPrice =
    readNumberField(o, 'finalPrice', 'FinalPrice') ?? price?.finalPrice ?? 0;

  return {
    id: id ?? productId!,
    productId,
    slug: readStringField(o, 'slug', 'Slug') ?? '',
    sku: readStringField(o, 'sku', 'Sku', 'SKU') ?? '',
    name: readStringField(o, 'name', 'Name') ?? '',
    nameAr: readStringField(o, 'nameAr', 'NameAr'),
    nameEn: readStringField(o, 'nameEn', 'NameEn'),
    categoryId: readNumberField(o, 'categoryId', 'CategoryId') ?? 0,
    categoryName: readStringField(o, 'categoryName', 'CategoryName') ?? '',
    categoryNameAr: readStringField(o, 'categoryNameAr', 'CategoryNameAr'),
    categoryNameEn: readStringField(o, 'categoryNameEn', 'CategoryNameEn'),
    brandId: readNumberField(o, 'brandId', 'BrandId') ?? null,
    brandName: readStringField(o, 'brandName', 'BrandName') ?? null,
    brandNameAr: readStringField(o, 'brandNameAr', 'BrandNameAr') ?? null,
    brandNameEn: readStringField(o, 'brandNameEn', 'BrandNameEn') ?? null,
    mainImageUrl:
      readStringField(o, 'mainImageUrl', 'MainImageUrl', 'imageUrl', 'ImageUrl') ?? null,
    isFeatured: readBoolField(o, 'isFeatured', 'IsFeatured'),
    isNewArrival: readBoolField(o, 'isNewArrival', 'IsNewArrival'),
    isBestSeller: readBoolField(o, 'isBestSeller', 'IsBestSeller'),
    price: price ?? {
      productVariantId: 0,
      basePrice: 0,
      customerPrice: finalPrice,
      discountAmount: 0,
      couponDiscountAmount: 0,
      taxAmount: 0,
      finalPrice,
    },
    oldPrice: readNumberField(o, 'oldPrice', 'OldPrice') ?? null,
    finalPrice,
    discountPercent: readNumberField(o, 'discountPercent', 'DiscountPercent') ?? null,
    hasVariants: readBoolField(o, 'hasVariants', 'HasVariants'),
    availabilityStatus: readStringField(o, 'availabilityStatus', 'AvailabilityStatus'),
    availableStatus: readStringField(o, 'availableStatus', 'AvailableStatus'),
  };
}

export function normalizeSearchProductsResultItems(items: unknown[]): PublicSearchProductDto[] {
  return items
    .map((item) => normalizePublicSearchProductDto(item))
    .filter((item): item is PublicSearchProductDto => item != null);
}
