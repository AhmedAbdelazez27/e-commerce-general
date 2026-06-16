import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { LanguageService } from '../../../../core/services/language.service';
import { EcPublicCatalogApiService } from '../../../../layout/services/ec-public-catalog-api.service';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { brandDisplayName } from '../../../../shared/utils/brand-display.util';
import { HomeBrandCard, HomeBrandsConfig } from '../../models/home.model';
import { mapPublicBrandsToHomeBrandCards } from '../../utils/home-brand.mapper';

@Component({
  selector: 'app-home-brands',
  imports: [RouterLink, TranslateModule, SectionHeaderComponent],
  templateUrl: './home-brands.component.html',
})
export class HomeBrandsComponent implements OnInit {
  private readonly catalogApi = inject(EcPublicCatalogApiService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  readonly config = input.required<HomeBrandsConfig>();

  readonly loading = signal(false);
  readonly apiBrands = signal<HomeBrandCard[]>([]);

  readonly usesApi = computed(() => !(this.config().items?.length));
  readonly displayBrands = computed(() => {
    const fromApi = this.apiBrands();
    if (fromApi.length > 0) {
      return fromApi;
    }
    return this.config().items ?? [];
  });
  readonly hasBrands = computed(() => this.displayBrands().length > 0);

  ngOnInit(): void {
    this.loadFromApi();
    this.translate.onLangChange.subscribe(() => this.loadFromApi());
  }

  brandName(brand: HomeBrandCard): string {
    if (brand.nameKey) {
      return this.translate.instant(brand.nameKey);
    }
    return brandDisplayName(brand, this.language.currentLang());
  }

  private loadFromApi(): void {
    if (!this.usesApi()) {
      return;
    }

    this.loading.set(true);
    const lang = this.language.apiCulture();

    this.catalogApi
      .getBrands(lang)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (brands) => {
          this.apiBrands.set(mapPublicBrandsToHomeBrandCards(brands, this.config().maxItems));
        },
        error: () => {
          this.apiBrands.set([]);
        },
      });
  }
}
