import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { LanguageService } from '../../../../core/services/language.service';
import { EcPublicCatalogApiService } from '../../../../layout/services/ec-public-catalog-api.service';
import { CategoryTileComponent } from '../../../../shared/components/category-tile/category-tile.component';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { categoryDisplayName } from '../../../../shared/utils/category-shop-link.util';
import { HomeCategoryShortcut } from '../../models/home.model';
import { mapCategoryToHomeShortcut } from '../../utils/home-category.mapper';
import { rootCategoriesFromTree } from '../../../categories/utils/category-tree.util';

@Component({
  selector: 'app-home-category-shortcuts',
  imports: [TranslateModule, SectionHeaderComponent, CategoryTileComponent],
  templateUrl: './home-category-shortcuts.component.html',
})
export class HomeCategoryShortcutsComponent {
  private readonly catalogApi = inject(EcPublicCatalogApiService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly categories = signal<HomeCategoryShortcut[]>([]);

  readonly hasCategories = computed(() => this.categories().length > 0);

  constructor() {
    this.load();
    this.translate.onLangChange.subscribe(() => this.load());
  }

  categoryName(cat: HomeCategoryShortcut): string {
    if (cat.labelKey) {
      return this.translate.instant(cat.labelKey);
    }
    if (cat.nameEn != null || cat.nameAr != null) {
      return categoryDisplayName(
        { nameEn: cat.nameEn ?? '', nameAr: cat.nameAr ?? '' },
        this.language.currentLang(),
      );
    }
    return '';
  }

  categoryDescription(cat: HomeCategoryShortcut): string {
    const raw = cat.description?.trim();
    if (raw) {
      return raw;
    }
    const lang = this.language.currentLang();
    if (lang === 'ar') {
      return cat.descriptionAr?.trim() ?? cat.descriptionEn?.trim() ?? '';
    }
    return cat.descriptionEn?.trim() ?? cat.descriptionAr?.trim() ?? '';
  }

  private load(): void {
    this.loading.set(true);
    const lang = this.language.apiCulture();

    this.catalogApi
      .getCategoriesTree(lang)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (tree) => {
          const roots = rootCategoriesFromTree(tree);
          this.categories.set(roots.map(mapCategoryToHomeShortcut));
        },
        error: () => {
          this.categories.set([]);
        },
      });
  }
}
