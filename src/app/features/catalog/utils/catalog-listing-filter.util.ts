import {
  CatalogListingFilters,
  CatalogListingProduct,
  CatalogSortOption,
} from '../models/catalog-listing.model';

export function productMatchesSearch(product: CatalogListingProduct, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return (
    product.nameEn.toLowerCase().includes(q) ||
    product.nameAr.includes(q) ||
    product.brandNameEn.toLowerCase().includes(q) ||
    product.brandNameAr.includes(q) ||
    product.categoryNameEn.toLowerCase().includes(q)
  );
}

export function productHasOffer(product: CatalogListingProduct): boolean {
  return (
    product.hasOffer === true ||
    (product.compareAtPrice != null && product.compareAtPrice > product.price) ||
    (product.discountPercent != null && product.discountPercent > 0)
  );
}

export function filterCatalogProducts(
  products: CatalogListingProduct[],
  filters: CatalogListingFilters,
  searchQuery = '',
): CatalogListingProduct[] {
  return products.filter((product) => {
    if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(product.categoryId)) {
      return false;
    }
    if (filters.brandIds.length > 0 && !filters.brandIds.includes(product.brandId)) {
      return false;
    }
    if (filters.minPrice != null && product.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice != null && product.price > filters.maxPrice) {
      return false;
    }
    if (filters.minRating != null && (product.rating ?? 0) < filters.minRating) {
      return false;
    }
    if (filters.inStockOnly && !product.isAvailable) {
      return false;
    }
    if (filters.offersOnly && !productHasOffer(product)) {
      return false;
    }
    if (!productMatchesSearch(product, searchQuery)) {
      return false;
    }
    return true;
  });
}

export function sortCatalogProducts(
  products: CatalogListingProduct[],
  sort: CatalogSortOption,
): CatalogListingProduct[] {
  const list = [...products];
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price);
    case 'newest':
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'rating':
      return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case 'name':
      return list.sort((a, b) => a.nameEn.localeCompare(b.nameEn, undefined, { sensitivity: 'base' }));
    case 'featured':
    default:
      return list.sort((a, b) => {
        const score = (p: CatalogListingProduct) =>
          (p.isBestSeller ? 4 : 0) + (p.isNew ? 2 : 0) + (productHasOffer(p) ? 1 : 0);
        return score(b) - score(a) || b.reviewCount! - (a.reviewCount ?? 0);
      });
  }
}
