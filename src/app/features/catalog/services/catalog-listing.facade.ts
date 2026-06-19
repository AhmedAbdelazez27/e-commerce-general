import { Injectable, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { LanguageService } from '../../../core/services/language.service';
import { PublicCategoryDto } from '../../../layout/models/catalog-public.model';
import { EcPublicCatalogApiService } from '../../../layout/services/ec-public-catalog-api.service';
import {
  CatalogBreadcrumbItem,
  CatalogCategoryOption,
  CatalogListingFilters,
  CatalogSortOption,
  CatalogSpecificationGroup,
  CatalogSubcategoryItem,
  CatalogViewMode,
  DEFAULT_CATALOG_FILTERS,
} from '../models/catalog-listing.model';
import { CatalogListingApiService } from './catalog-listing-api.service';
import {
  buildCategoryLookup,
  categoryAncestorChain,
  categoryNodeForId,
  categorySlugForId,
  resolveCategoryFromQueryParams,
} from '../utils/catalog-category-index.util';
import { SHOP_ROUTE, categoryShopQueryParams } from '../../../shared/utils/category-shop-link.util';
import {
  CATALOG_PAGE_SIZE,
  buildGetProductFiltersParams,
  buildSearchProductsRequest,
  mapFilterBrandsToOptions,
  mapFilterCategoriesToOptions,
  mapFilterSpecificationsToGroups,
  mapSearchProductsToListingProducts,
} from '../utils/catalog-listing-api.mapper';

@Injectable()
export class CatalogListingFacade {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listingApi = inject(CatalogListingApiService);
  private readonly catalogApi = inject(EcPublicCatalogApiService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  private readonly categoryLookup = signal<Map<string, PublicCategoryDto>>(new Map());
  private readonly products = signal<ReturnType<typeof mapSearchProductsToListingProducts>>([]);
  private readonly totalCount = signal(0);
  private readonly skipCount = signal(0);
  private navigatingFromFacade = false;

  readonly categories = signal<CatalogCategoryOption[]>([]);
  readonly brands = signal<ReturnType<typeof mapFilterBrandsToOptions>>([]);
  readonly specifications = signal<CatalogSpecificationGroup[]>([]);
  readonly priceBounds = signal({ min: 0, max: 0 });
  readonly loading = signal(false);
  readonly initialized = signal(false);

  readonly filters = signal<CatalogListingFilters>({ ...DEFAULT_CATALOG_FILTERS });
  readonly draftFilters = signal<CatalogListingFilters>({ ...DEFAULT_CATALOG_FILTERS });
  readonly sort = signal<CatalogSortOption>('featured');
  readonly viewMode = signal<CatalogViewMode>('grid');
  readonly searchQuery = signal('');
  readonly mobileFiltersOpen = signal(false);

  readonly activeCategoryId = signal<string | null>(null);

  readonly filteredProducts = computed(() => this.products());
  readonly productCount = computed(() => this.totalCount());

  readonly activeCategory = computed(() => {
    const id = this.activeCategoryId();
    if (!id) {
      return null;
    }
    const fromFilters = this.categories().find((c) => c.id === id);
    if (fromFilters) {
      return fromFilters;
    }
    const node = categoryNodeForId(id, this.categoryLookup());
    if (!node) {
      return null;
    }
    return {
      id: String(node.id),
      slug: node.slug,
      nameEn: node.nameEn,
      nameAr: node.nameAr,
      descriptionEn: node.description ?? undefined,
      descriptionAr: node.description ?? undefined,
    } satisfies CatalogCategoryOption;
  });

  readonly subcategoryRail = computed((): CatalogSubcategoryItem[] => {
    const id = this.activeCategoryId();
    if (!id) {
      return [];
    }
    const node = categoryNodeForId(id, this.categoryLookup());
    const children = node?.children ?? [];
    if (!children.length) {
      return [];
    }

    return [...children]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((child) => ({
        id: String(child.id),
        slug: child.slug,
        nameEn: child.nameEn,
        nameAr: child.nameAr,
        imageUrl: child.imageUrl ?? child.iconUrl ?? null,
        count: child.count,
      }));
  });

  readonly breadcrumbs = computed((): CatalogBreadcrumbItem[] => {
    const items: CatalogBreadcrumbItem[] = [
      { labelKey: 'PAGE.HOME', route: '/home' },
      { labelKey: 'PAGE.SHOP', route: SHOP_ROUTE },
    ];
    const categoryId = this.activeCategoryId();
    const search = this.searchQuery().trim();
    const lookup = this.categoryLookup();

    if (categoryId) {
      const chain = categoryAncestorChain(categoryId, lookup);
      const leaf = categoryNodeForId(categoryId, lookup);
      const nodes = chain.length ? chain : leaf ? [leaf] : [];

      nodes.forEach((node, index) => {
        const isLeaf = index === nodes.length - 1;
        items.push({
          labelEn: node.nameEn,
          labelAr: node.nameAr,
          route: isLeaf && !search ? undefined : SHOP_ROUTE,
          queryParams: isLeaf && !search ? undefined : categoryShopQueryParams(node),
          current: isLeaf && !search,
        });
      });

      if (search) {
        items.push({ labelKey: 'CATALOG.BREADCRUMB_SEARCH', current: true });
      }
      return items;
    }

    if (search) {
      items[items.length - 1].current = false;
      items.push({ labelKey: 'CATALOG.BREADCRUMB_SEARCH', current: true });
    } else {
      items[items.length - 1].current = true;
    }
    return items;
  });

  constructor() {
    this.translate.onLangChange.subscribe(() => this.reloadCatalog());
  }

  handleRouteQueryChange(): void {
    if (this.navigatingFromFacade || !this.initialized()) {
      return;
    }
    this.initFromRoute();
    this.reloadCatalog();
  }

  initFromRoute(): void {
    const params = this.readRouteQueryParams();
    const brands = params.getAll('brand');
    const q = params.get('q') ?? '';
    const sort = params.get('sort') as CatalogSortOption | null;

    const resolvedCategoryId = resolveCategoryFromQueryParams(params, this.categoryLookup());

    const filters: CatalogListingFilters = {
      ...DEFAULT_CATALOG_FILTERS,
      categoryIds: resolvedCategoryId ? [resolvedCategoryId] : [],
      brandIds: brands,
    };

    this.activeCategoryId.set(resolvedCategoryId);
    this.searchQuery.set(q);
    this.filters.set(filters);
    this.draftFilters.set({ ...filters });
    this.skipCount.set(0);
    if (sort && this.isValidSort(sort)) {
      this.sort.set(sort);
    }
  }

  bootstrap(): void {
    const lang = this.language.apiCulture();
    this.loading.set(true);

    this.catalogApi
      .getCategoriesTree(lang)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((tree) => {
        this.categoryLookup.set(buildCategoryLookup(tree));
        this.initFromRoute();
        this.initialized.set(true);
        this.reloadCatalog();
      });
  }

  reloadCatalog(): void {
    if (!this.initialized()) {
      return;
    }

    const lang = this.language.apiCulture();
    const filters = this.filters();
    const filterParams = buildGetProductFiltersParams(filters, this.searchQuery(), lang);
    const searchBody = buildSearchProductsRequest(
      filters,
      this.searchQuery(),
      lang,
      this.sort(),
      this.skipCount(),
      CATALOG_PAGE_SIZE,
    );

    this.loading.set(true);
    forkJoin({
      facets: this.listingApi.getProductFilters(filterParams),
      listing: this.listingApi.searchProducts(searchBody),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ facets, listing }) => {
        this.categories.set(mapFilterCategoriesToOptions(facets.categories));
        this.brands.set(mapFilterBrandsToOptions(facets.brands));
        this.specifications.set(mapFilterSpecificationsToGroups(facets.specifications));
        this.priceBounds.set({
          min: facets.priceRange.minPrice,
          max: facets.priceRange.maxPrice,
        });
        this.products.set(
          mapSearchProductsToListingProducts(listing.items, this.language.currentLang()),
        );
        this.totalCount.set(listing.totalCount);
      });
  }

  syncQueryParams(): void {
    const filters = this.filters();
    const lookup = this.categoryLookup();
    const q = this.searchQuery().trim();

    let category: string | null = null;
    if (filters.categoryIds.length === 1) {
      category = categorySlugForId(filters.categoryIds[0], lookup) ?? filters.categoryIds[0];
    }

    this.navigatingFromFacade = true;
    void this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: {
          category,
          categoryId: filters.categoryIds.length === 1 ? filters.categoryIds[0] : null,
          brand: filters.brandIds.length > 0 ? filters.brandIds : null,
          q: q || null,
          sort: this.sort() !== 'featured' ? this.sort() : null,
        },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      })
      .finally(() => {
        this.navigatingFromFacade = false;
      });
    this.activeCategoryId.set(filters.categoryIds.length === 1 ? filters.categoryIds[0] : null);
  }

  patchFilters(patch: Partial<CatalogListingFilters>, options?: { syncUrl?: boolean }): void {
    this.skipCount.set(0);
    this.filters.update((current) => ({ ...current, ...patch }));
    if (options?.syncUrl !== false) {
      this.syncQueryParams();
    }
    this.reloadCatalog();
  }

  setSort(value: CatalogSortOption): void {
    this.skipCount.set(0);
    this.sort.set(value);
    this.syncQueryParams();
    this.reloadCatalog();
  }

  setViewMode(mode: CatalogViewMode): void {
    this.viewMode.set(mode);
  }

  clearFilters(): void {
    this.filters.set({ ...DEFAULT_CATALOG_FILTERS });
    this.draftFilters.set({ ...DEFAULT_CATALOG_FILTERS });
    this.activeCategoryId.set(null);
    this.searchQuery.set('');
    this.skipCount.set(0);
    this.navigatingFromFacade = true;
    void this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      })
      .finally(() => {
        this.navigatingFromFacade = false;
      });
    this.reloadCatalog();
  }

  openMobileFilters(): void {
    this.draftFilters.set({ ...this.filters() });
    this.mobileFiltersOpen.set(true);
  }

  closeMobileFilters(): void {
    this.mobileFiltersOpen.set(false);
  }

  applyDraftFilters(): void {
    this.skipCount.set(0);
    this.filters.set({ ...this.draftFilters() });
    this.syncQueryParams();
    this.reloadCatalog();
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

  toggleDraftSpecification(specificationId: number, value: string): void {
    this.draftFilters.update((current) => ({
      ...current,
      specificationSelections: toggleSpecificationSelection(
        current.specificationSelections,
        specificationId,
        value,
      ),
    }));
  }

  toggleFilterSpecification(specificationId: number, value: string): void {
    const current = this.filters();
    this.patchFilters({
      specificationSelections: toggleSpecificationSelection(
        current.specificationSelections,
        specificationId,
        value,
      ),
    });
  }

  isSpecificationChecked(
    specificationId: number,
    value: string,
    source: CatalogListingFilters,
  ): boolean {
    const selection = source.specificationSelections.find(
      (item) => item.specificationId === specificationId,
    );
    return selection?.values.includes(value) ?? false;
  }

  private readRouteQueryParams() {
    return this.router.routerState.snapshot.root.queryParamMap;
  }

  private isValidSort(value: string): value is CatalogSortOption {
    return ['featured', 'price-asc', 'price-desc', 'newest', 'rating', 'name'].includes(value);
  }
}

function toggleSpecificationSelection(
  selections: CatalogListingFilters['specificationSelections'],
  specificationId: number,
  value: string,
): CatalogListingFilters['specificationSelections'] {
  const next = selections.map((item) => ({
    specificationId: item.specificationId,
    values: [...item.values],
  }));
  const index = next.findIndex((item) => item.specificationId === specificationId);

  if (index === -1) {
    return [...next, { specificationId, values: [value] }];
  }

  const values = next[index].values;
  next[index].values = values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];

  return next.filter((item) => item.values.length > 0);
}
