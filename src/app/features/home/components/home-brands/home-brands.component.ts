import { Component, ElementRef, OnInit, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { LanguageService } from '../../../../core/services/language.service';
import { EcPublicCatalogApiService } from '../../../../layout/services/ec-public-catalog-api.service';
import { brandDisplayName } from '../../../../shared/utils/brand-display.util';
import { HomeBrandCard, HomeBrandsConfig } from '../../models/home.model';
import { mapPublicBrandsToHomeBrandCards } from '../../utils/home-brand.mapper';
import { productRailEdges, slideProductRail } from '../../utils/home-product-rail.util';

@Component({
  selector: 'app-home-brands',
  imports: [RouterLink, TranslateModule],
  templateUrl: './home-brands.component.html',
  styleUrl: './home-brands.component.scss',
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

  private readonly rail = viewChild<ElementRef<HTMLElement>>('rail');
  readonly canPrev = signal(false);
  readonly canNext = signal(false);

  constructor() {
    effect((onCleanup) => {
      const rail = this.rail()?.nativeElement;
      this.displayBrands();
      if (!rail) {
        return;
      }

      const sync = () => this.syncRail();
      rail.scrollLeft = 0;
      const observer = new ResizeObserver(sync);
      observer.observe(rail);
      const frame = requestAnimationFrame(sync);
      onCleanup(() => {
        cancelAnimationFrame(frame);
        observer.disconnect();
      });
    });
  }

  ngOnInit(): void {
    this.loadFromApi();
    this.translate.onLangChange.subscribe(() => this.loadFromApi());
  }

  slide(direction: -1 | 1): void {
    const rail = this.rail()?.nativeElement;
    if (!rail) {
      return;
    }

    slideProductRail(rail, direction, '.home-brand-strip__item');
  }

  syncRail(): void {
    const rail = this.rail()?.nativeElement;
    if (!rail) {
      this.canPrev.set(false);
      this.canNext.set(false);
      return;
    }

    const edges = productRailEdges(rail);
    this.canPrev.set(edges.canPrev);
    this.canNext.set(edges.canNext);
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
