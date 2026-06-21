/** Selected specification filter for EcPublicCatalog listing endpoints. */
export interface PublicSpecificationFilterDto {
  specificationTypeId: number;
  value?: string;
  values?: string[];
  minValue?: number;
  maxValue?: number;
  minNumericValue?: number;
  maxNumericValue?: number;
  boolValue?: boolean;
}

/** GET GetProductFilters query parameters. */
export interface GetProductFiltersParams {
  searchText?: string;
  categoryId?: number;
  brandIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  includeChildrenCategories?: boolean;
  lang?: string;
  specificationFilters?: PublicSpecificationFilterDto[];
}

/** POST SearchProducts request body — only send fields the user actually selected. */
export interface SearchProductsRequest {
  categoryId?: number;
  brandId?: number;
  brandIds?: number[];
  searchText?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  sortBy?: string;
  lang?: string;
  includeChildrenCategories?: boolean;
  specificationFilters?: PublicSpecificationFilterDto[];
  skipCount?: number;
  maxResultCount?: number;
}

export interface PublicFilterCategoryDto {
  id: number;
  parentCategoryId: number | null;
  name: string;
  slug: string;
  count: number;
}

export interface PublicFilterBrandDto {
  id: number;
  name: string;
  logoUrl?: string | null;
  count: number;
}

export interface PublicFilterPriceRangeDto {
  minPrice: number;
  maxPrice: number;
}

export interface PublicFilterSpecificationOptionDto {
  value: string;
  displayValue: string;
  count: number;
}

export interface PublicFilterSpecificationDto {
  id: number;
  name: string;
  nameAr: string;
  nameEn: string;
  code: string;
  dataType: string;
  options: PublicFilterSpecificationOptionDto[];
}

export interface PublicFilterFlagsDto {
  featured: number;
  newArrival: number;
  bestSeller: number;
}

export interface GetProductFiltersResult {
  categories: PublicFilterCategoryDto[];
  brands: PublicFilterBrandDto[];
  priceRange: PublicFilterPriceRangeDto;
  specifications: PublicFilterSpecificationDto[];
  flags: PublicFilterFlagsDto;
}

export interface PublicSearchProductPriceDto {
  productVariantId: number;
  basePrice: number;
  customerPrice: number;
  discountAmount: number;
  couponDiscountAmount: number;
  taxAmount: number;
  finalPrice: number;
}

export interface PublicSearchProductDto {
  id: number;
  productId?: number;
  slug: string;
  sku: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  categoryId: number;
  categoryName: string;
  categoryNameAr?: string;
  categoryNameEn?: string;
  brandId?: number | null;
  brandName?: string | null;
  brandNameAr?: string | null;
  brandNameEn?: string | null;
  mainImageUrl?: string | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  price: PublicSearchProductPriceDto;
  oldPrice?: number | null;
  finalPrice: number;
  discountPercent?: number | null;
  hasVariants: boolean;
  createdDate?: string | null;
  availabilityStatus?: string;
  availableStatus?: string;
}

export interface SearchProductsResult {
  totalCount: number;
  items: PublicSearchProductDto[];
}
