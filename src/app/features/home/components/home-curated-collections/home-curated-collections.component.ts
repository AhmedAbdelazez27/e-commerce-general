import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { LanguageService } from '../../../../core/services/language.service';
import { CatalogListingApiService } from '../../../catalog/services/catalog-listing-api.service';
import { HomeCuratedCollection, HomeCuratedCollectionsConfig } from '../../models/home.model';
import { mapFeaturedProductsToCuratedCollections } from '../../utils/home-curated.mapper';
import { buildHomeProductSearchRequest } from '../../utils/home-product-search.util';

@Component({
  selector: 'app-home-curated-collections',
  imports: [RouterLink, TranslateModule],
  templateUrl: './home-curated-collections.component.html',
})
export class HomeCuratedCollectionsComponent implements OnInit {
  private readonly listingApi = inject(CatalogListingApiService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  readonly config = input.required<HomeCuratedCollectionsConfig>();

  readonly loading = signal(false);
  readonly apiItems = signal<HomeCuratedCollection[]>([]);

  readonly usesApi = computed(() => !!this.config().searchFilter);
  readonly displayItems = computed(() => {
    const fromApi = this.apiItems();
    if (fromApi.length > 0) {
      return fromApi;
    }
    return this.config().items ?? [];
  });
  readonly hasItems = computed(() => this.displayItems().length > 0);

  ngOnInit(): void {
    this.loadFromApi();
    this.translate.onLangChange.subscribe(() => this.loadFromApi());
  }

  eyebrow(item: HomeCuratedCollection): string {
    if (item.eyebrow?.trim()) {
      return item.eyebrow;
    }
    if (item.eyebrowKey) {
      return this.translate.instant(item.eyebrowKey);
    }
    return '';
  }

  title(item: HomeCuratedCollection): string {
    if (item.title?.trim()) {
      return item.title;
    }
    if (item.titleKey) {
      return this.translate.instant(item.titleKey);
    }
    return '';
  }

  hoverCta(item: HomeCuratedCollection): string {
    if (item.hoverCta?.trim()) {
      return item.hoverCta;
    }
    if (item.hoverCtaKey) {
      return this.translate.instant(item.hoverCtaKey);
    }
    return '';
  }

  imageAlt(item: HomeCuratedCollection): string {
    if (item.imageAlt?.trim()) {
      return item.imageAlt;
    }
    if (item.imageAltKey) {
      return this.translate.instant(item.imageAltKey);
    }
    return this.title(item);
  }

  private loadFromApi(): void {
    const filter = this.config().searchFilter;
    if (!filter) {
      return;
    }

    this.loading.set(true);
    const lang = this.language.apiCulture();
    const body = buildHomeProductSearchRequest(filter, lang, this.config().maxItems);

    this.listingApi
      .searchProducts(body)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          this.apiItems.set(
            mapFeaturedProductsToCuratedCollections(result.items, this.language.currentLang()),
          );
        },
        error: () => {
          this.apiItems.set([]);
        },
      });
  }
}
