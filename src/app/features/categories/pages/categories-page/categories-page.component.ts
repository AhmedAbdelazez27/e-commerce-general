import { Component, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { CatalogBreadcrumbComponent } from '../../../catalog/components/catalog-breadcrumb/catalog-breadcrumb.component';
import { CatalogBreadcrumbItem } from '../../../catalog/models/catalog-listing.model';
import { LanguageService } from '../../../../core/services/language.service';
import { EcPublicCatalogApiService } from '../../../../layout/services/ec-public-catalog-api.service';
import { PublicCategoryDto } from '../../../../layout/models/catalog-public.model';
import { CategoryTileComponent } from '../../../../shared/components/category-tile/category-tile.component';
import {
  categoryDisplayName,
  categoryShopQueryParams,
  SHOP_ROUTE,
} from '../../../../shared/utils/category-shop-link.util';
import { flattenCategoriesTree } from '../../utils/category-tree.util';

@Component({
  selector: 'app-categories-page',
  imports: [TranslateModule, CatalogBreadcrumbComponent, CategoryTileComponent],
  templateUrl: './categories-page.component.html',
})
export class CategoriesPageComponent {
  private readonly catalogApi = inject(EcPublicCatalogApiService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly categories = signal<PublicCategoryDto[]>([]);
  readonly loadFailed = signal(false);

  readonly shopRoute = SHOP_ROUTE;

  readonly breadcrumbs: CatalogBreadcrumbItem[] = [
    { labelKey: 'PAGE.HOME', route: '/home' },
    { labelKey: 'PAGE.CATEGORIES', current: true },
  ];

  constructor() {
    this.load();
    this.translate.onLangChange.subscribe(() => this.load());
  }

  reload(): void {
    this.load();
  }

  name(node: PublicCategoryDto): string {
    return categoryDisplayName(node, this.language.currentLang());
  }

  description(node: PublicCategoryDto): string {
    return node.description?.trim() ?? '';
  }

  imageUrl(node: PublicCategoryDto): string | null {
    return node.imageUrl ?? null;
  }

  shopQuery(node: PublicCategoryDto): Record<string, string> {
    return categoryShopQueryParams(node);
  }

  private load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    const lang = this.language.apiCulture();

    this.catalogApi
      .getCategoriesTree(lang)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (nodes) => {
          const flat = flattenCategoriesTree(nodes);
          this.categories.set(flat);
          this.loadFailed.set(flat.length === 0);
        },
        error: () => {
          this.categories.set([]);
          this.loadFailed.set(true);
        },
      });
  }
}
