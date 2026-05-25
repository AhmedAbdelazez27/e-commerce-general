import { Component, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageService } from '../../../../core/services/language.service';
import { CatalogCategoryOption } from '../../models/catalog-listing.model';

@Component({
  selector: 'app-catalog-listing-header',
  imports: [TranslateModule],
  templateUrl: './catalog-listing-header.component.html',
})
export class CatalogListingHeaderComponent {
  private readonly language = inject(LanguageService);

  readonly titleKey = input<string | undefined>('CATALOG.ALL_PRODUCTS');
  readonly titleEn = input<string>();
  readonly titleAr = input<string>();
  readonly productCount = input.required<number>();
  readonly category = input<CatalogCategoryOption | null>(null);
  readonly searchQuery = input('');

  resolvedTitle(): string {
    const en = this.titleEn();
    const ar = this.titleAr();
    if (en || ar) {
      return this.language.currentLang() === 'ar' && ar ? ar : (en ?? '');
    }
    return this.titleKey() ?? 'CATALOG.ALL_PRODUCTS';
  }

  useTitleKey(): boolean {
    return !this.titleEn() && !this.titleAr();
  }

  resolvedDescription(): string | null {
    const cat = this.category();
    if (!cat) {
      return null;
    }
    return this.language.currentLang() === 'ar'
      ? (cat.descriptionAr ?? null)
      : (cat.descriptionEn ?? null);
  }
}
