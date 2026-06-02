import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { LanguageService } from '../../core/services/language.service';
import { NavCategory } from '../models/layout.model';
import {
  buildBrandsNavItem,
  mapCategoriesTreeToNav,
} from '../utils/navigation-mapper.util';
import { EcPublicCatalogApiService } from './ec-public-catalog-api.service';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly catalogApi = inject(EcPublicCatalogApiService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  readonly categories = signal<NavCategory[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.load();
    this.translate.onLangChange.subscribe(() => this.load());
  }

  reload(): void {
    this.load();
  }

  private load(): void {
    const lang = this.language.apiCulture();
    this.loading.set(true);

    forkJoin({
      tree: this.catalogApi.getCategoriesTree(lang),
      brands: this.catalogApi.getBrands(lang),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ tree, brands }) => {
        const categories = mapCategoriesTreeToNav(tree);
        const brandsItem = buildBrandsNavItem(brands);
        this.categories.set([...categories, brandsItem]);
      });
  }
}
