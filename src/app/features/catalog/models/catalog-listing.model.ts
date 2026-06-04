export type CatalogSortOption =
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'rating'
  | 'name';

export type CatalogViewMode = 'grid' | 'list';

export interface CatalogSpecificationSelection {
  specificationId: number;
  values: string[];
}

export interface CatalogListingFilters {
  categoryIds: string[];
  brandIds: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  inStockOnly: boolean;
  offersOnly: boolean;
  specificationSelections: CatalogSpecificationSelection[];
}

export interface CatalogSpecificationOption {
  value: string;
  displayValue: string;
  count: number;
}

export interface CatalogSpecificationGroup {
  id: number;
  nameEn: string;
  nameAr: string;
  code: string;
  options: CatalogSpecificationOption[];
}

export interface CatalogCategoryOption {
  id: string;
  slug?: string;
  nameEn: string;
  nameAr: string;
  count?: number;
  descriptionEn?: string;
  descriptionAr?: string;
  parentId?: string;
  parentNameEn?: string;
  parentNameAr?: string;
}

export interface CatalogBrandOption {
  id: string;
  nameEn: string;
  nameAr: string;
  count?: number;
}

export interface CatalogListingProduct {
  id: number;
  productVariantId?: number;
  slug?: string;
  nameEn: string;
  nameAr: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  categoryNameEn: string;
  categoryNameAr: string;
  brandId: string;
  brandNameEn: string;
  brandNameAr: string;
  rating?: number;
  reviewCount?: number;
  isAvailable: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  hasOffer?: boolean;
  discountPercent?: number;
  imageUrl?: string;
  createdAt: string;
}

export interface CatalogBreadcrumbItem {
  labelKey?: string;
  labelEn?: string;
  labelAr?: string;
  route?: string | string[];
  queryParams?: Record<string, string>;
  current?: boolean;
}

export const DEFAULT_CATALOG_FILTERS: CatalogListingFilters = {
  categoryIds: [],
  brandIds: [],
  minPrice: null,
  maxPrice: null,
  minRating: null,
  inStockOnly: false,
  offersOnly: false,
  specificationSelections: [],
};
