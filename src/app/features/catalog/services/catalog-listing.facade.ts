import { Injectable, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  CATALOG_LISTING_BRANDS,
  CATALOG_LISTING_CATEGORIES,
  CATALOG_LISTING_PRODUCTS,
  CATALOG_PRICE_BOUNDS,
} from '../data/catalog-listing.mock';
import {
  CatalogBreadcrumbItem,
  CatalogCategoryOption,
  CatalogListingFilters,
  CatalogSortOption,
  CatalogViewMode,
  DEFAULT_CATALOG_FILTERS,
} from '../models/catalog-listing.model';
import { filterCatalogProducts, sortCatalogProducts } from '../utils/catalog-listing-filter.util';

@Injectable()
export class CatalogListingFacade {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly allProducts = signal(CATALOG_LISTING_PRODUCTS);
  readonly categories = signal(CATALOG_LISTING_CATEGORIES);
  readonly brands = signal(CATALOG_LISTING_BRANDS);
  readonly priceBounds = CATALOG_PRICE_BOUNDS;

  readonly filters = signal<CatalogListingFilters>({ ...DEFAULT_CATALOG_FILTERS });
  readonly draftFilters = signal<CatalogListingFilters>({ ...DEFAULT_CATALOG_FILTERS });
  readonly sort = signal<CatalogSortOption>('featured');
  readonly viewMode = signal<CatalogViewMode>('grid');
  readonly searchQuery = signal('');
  readonly mobileFiltersOpen = signal(false);

  readonly activeCategoryId = signal<string | null>(null);

  readonly filteredProducts = computed(() => {
    const filtered = filterCatalogProducts(
      this.allProducts(),
      this.filters(),
      this.searchQuery(),
    );
    return sortCatalogProducts(filtered, this.sort());
  });

  readonly productCount = computed(() => this.filteredProducts().length);

  readonly activeCategory = computed(() => {
    const id = this.activeCategoryId();
    return id ? this.categories().find((c) => c.id === id) ?? null : null;
  });

  readonly breadcrumbs = computed((): CatalogBreadcrumbItem[] => {
    const items: CatalogBreadcrumbItem[] = [
      { labelKey: 'PAGE.HOME', route: '/home' },
      { labelKey: 'PAGE.SHOP', route: '/shop' },
    ];
    const category = this.activeCategory();
    const search = this.searchQuery().trim();

    if (category) {
      items.push({
        labelEn: category.nameEn,
        labelAr: category.nameAr,
        current: !search,
      });
      if (search) {
        items.push({ labelKey: 'CATALOG.BREADCRUMB_SEARCH', current: true });
      }
    } else if (search) {
      items[items.length - 1].current = false;
      items.push({ labelKey: 'CATALOG.BREADCRUMB_SEARCH', current: true });
    } else {
      items[items.length - 1].current = true;
    }
    return items;
  });

  initFromRoute(): void {
    const params = this.route.snapshot.queryParamMap;
    const category = params.get('category');
    const brand = params.get('brand');
    const q = params.get('q') ?? '';
    const sort = params.get('sort') as CatalogSortOption | null;

    const filters: CatalogListingFilters = {
      ...DEFAULT_CATALOG_FILTERS,
      categoryIds: category ? [category] : [],
      brandIds: brand ? [brand] : [],
    };

    this.activeCategoryId.set(category);
    this.searchQuery.set(q);
    this.filters.set(filters);
    this.draftFilters.set({ ...filters });
    if (sort && this.isValidSort(sort)) {
      this.sort.set(sort);
    }
  }

  syncQueryParams(): void {
    const filters = this.filters();
    const queryParams: Record<string, string> = {};
    if (filters.categoryIds.length === 1) {
      queryParams['category'] = filters.categoryIds[0];
    }
    if (filters.brandIds.length === 1) {
      queryParams['brand'] = filters.brandIds[0];
    }
    const q = this.searchQuery().trim();
    if (q) {
      queryParams['q'] = q;
    }
    if (this.sort() !== 'featured') {
      queryParams['sort'] = this.sort();
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.activeCategoryId.set(filters.categoryIds.length === 1 ? filters.categoryIds[0] : null);
  }

  patchFilters(patch: Partial<CatalogListingFilters>, options?: { syncUrl?: boolean }): void {
    this.filters.update((current) => ({ ...current, ...patch }));
    if (options?.syncUrl !== false) {
      this.syncQueryParams();
    }
  }

  setSort(value: CatalogSortOption): void {
    this.sort.set(value);
    this.syncQueryParams();
  }

  setViewMode(mode: CatalogViewMode): void {
    this.viewMode.set(mode);
  }

  clearFilters(): void {
    this.filters.set({ ...DEFAULT_CATALOG_FILTERS });
    this.draftFilters.set({ ...DEFAULT_CATALOG_FILTERS });
    this.activeCategoryId.set(null);
    this.searchQuery.set('');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  openMobileFilters(): void {
    this.draftFilters.set({ ...this.filters() });
    this.mobileFiltersOpen.set(true);
  }

  closeMobileFilters(): void {
    this.mobileFiltersOpen.set(false);
  }

  applyDraftFilters(): void {
    this.filters.set({ ...this.draftFilters() });
    this.syncQueryParams();
    this.closeMobileFilters();
  }

  patchDraftFilters(patch: Partial<CatalogListingFilters>): void {
    this.draftFilters.update((current) => ({ ...current, ...patch }));
  }

  toggleDraftCategory(id: string): void {
    this.draftFilters.update((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter((c) => c !== id)
        : [...f.categoryIds, id],
    }));
  }

  toggleDraftBrand(id: string): void {
    this.draftFilters.update((f) => ({
      ...f,
      brandIds: f.brandIds.includes(id)
        ? f.brandIds.filter((b) => b !== id)
        : [...f.brandIds, id],
    }));
  }

  toggleFilterCategory(id: string): void {
    const current = this.filters();
    const categoryIds = current.categoryIds.includes(id)
      ? current.categoryIds.filter((c) => c !== id)
      : [...current.categoryIds, id];
    this.patchFilters({ categoryIds });
  }

  toggleFilterBrand(id: string): void {
    const current = this.filters();
    const brandIds = current.brandIds.includes(id)
      ? current.brandIds.filter((b) => b !== id)
      : [...current.brandIds, id];
    this.patchFilters({ brandIds });
  }

  /** Replace mock catalog with API results. */
  setProductsFromApi(products: typeof CATALOG_LISTING_PRODUCTS): void {
    this.allProducts.set(products);
  }

  private isValidSort(value: string): value is CatalogSortOption {
    return ['featured', 'price-asc', 'price-desc', 'newest', 'rating', 'name'].includes(value);
  }
}
