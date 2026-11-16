import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize, map } from 'rxjs/operators';

import { CatalogBreadcrumbComponent } from '../../../catalog/components/catalog-breadcrumb/catalog-breadcrumb.component';
import { CatalogBreadcrumbItem } from '../../../catalog/models/catalog-listing.model';
import { buildCatalogPageTokens } from '../../../catalog/utils/catalog-pagination.util';
import { LanguageService } from '../../../../core/services/language.service';
import { resolveAttachmentUrl } from '../../../../core/utils/attachment-url.util';
import { EcPublicCatalogApiService } from '../../../../layout/services/ec-public-catalog-api.service';
import { PublicBrandDto } from '../../../../layout/models/catalog-public.model';
import { BrandTileComponent } from '../../../../shared/components/brand-tile/brand-tile.component';
import {
  brandDisplayName,
  brandInitials,
  brandShopQueryParams,
  brandShopRoute,
  sortPublicBrands,
} from '../../../../shared/utils/brand-display.util';

const BRANDS_PAGE_SIZE = 8;

@Component({
  selector: 'app-brands-page',
  imports: [TranslateModule, CatalogBreadcrumbComponent, BrandTileComponent],
  templateUrl: './brands-page.component.html',
})
export class BrandsPageComponent {
  private readonly catalogApi = inject(EcPublicCatalogApiService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly brandsTop = viewChild<ElementRef<HTMLElement>>('brandsTop');

  readonly loading = signal(true);
  readonly brands = signal<PublicBrandDto[]>([]);
  readonly loadFailed = signal(false);

  private readonly requestedPage = toSignal(
    this.route.queryParamMap.pipe(map((params) => Number(params.get('page')) || 1)),
    { initialValue: Number(this.route.snapshot.queryParamMap.get('page')) || 1 },
  );

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.brands().length / BRANDS_PAGE_SIZE)),
  );

  readonly pageNumber = computed(() => {
    const requested = this.requestedPage();
    const page = Number.isFinite(requested) ? Math.floor(requested) : 1;
    return Math.min(Math.max(1, page), this.totalPages());
  });

  readonly visibleBrands = computed(() => {
    const start = (this.pageNumber() - 1) * BRANDS_PAGE_SIZE;
    return this.brands().slice(start, start + BRANDS_PAGE_SIZE);
  });

  readonly rangeFrom = computed(() =>
    this.brands().length === 0 ? 0 : (this.pageNumber() - 1) * BRANDS_PAGE_SIZE + 1,
  );

  readonly rangeTo = computed(() =>
    this.brands().length === 0
      ? 0
      : Math.min(this.pageNumber() * BRANDS_PAGE_SIZE, this.brands().length),
  );

  readonly pageTokens = computed(() =>
    buildCatalogPageTokens(this.pageNumber(), this.totalPages()),
  );

  readonly shopRoute = brandShopRoute();

  readonly breadcrumbs: CatalogBreadcrumbItem[] = [
    { labelKey: 'PAGE.HOME', route: '/home' },
    { labelKey: 'PAGE.BRANDS', current: true },
  ];

  constructor() {
    this.load();
    this.translate.onLangChange.subscribe(() => this.load());
  }

  reload(): void {
    this.load();
  }

  name(brand: PublicBrandDto): string {
    return brandDisplayName(brand, this.language.currentLang());
  }

  initials(brand: PublicBrandDto): string {
    return brandInitials(brand.nameEn?.trim() || brand.name?.trim() || '');
  }

  description(brand: PublicBrandDto): string {
    return brand.description?.trim() ?? '';
  }

  logoUrl(brand: PublicBrandDto): string | null {
    return resolveAttachmentUrl(brand.logoUrl);
  }

  shopQuery(brand: PublicBrandDto): Record<string, string> {
    return brandShopQueryParams(brand);
  }

  onPageSelect(page: number): void {
    const next = Math.min(Math.max(1, Math.floor(page)), this.totalPages());
    if (next === this.pageNumber()) {
      return;
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: next > 1 ? next : null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    queueMicrotask(() => {
      this.brandsTop()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  private load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    const lang = this.language.apiCulture();

    this.catalogApi
      .getBrands(lang)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          const sorted = sortPublicBrands(items);
          this.brands.set(sorted);
          this.loadFailed.set(sorted.length === 0);
        },
        error: () => {
          this.brands.set([]);
          this.loadFailed.set(true);
        },
      });
  }
}
