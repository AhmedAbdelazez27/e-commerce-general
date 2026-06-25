import { Component, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { CatalogBreadcrumbComponent } from '../../../catalog/components/catalog-breadcrumb/catalog-breadcrumb.component';
import { CatalogBreadcrumbItem } from '../../../catalog/models/catalog-listing.model';
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

@Component({
  selector: 'app-brands-page',
  imports: [TranslateModule, CatalogBreadcrumbComponent, BrandTileComponent],
  templateUrl: './brands-page.component.html',
})
export class BrandsPageComponent {
  private readonly catalogApi = inject(EcPublicCatalogApiService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly brands = signal<PublicBrandDto[]>([]);
  readonly loadFailed = signal(false);

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
