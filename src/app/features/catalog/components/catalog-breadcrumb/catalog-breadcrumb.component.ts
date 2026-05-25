import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageService } from '../../../../core/services/language.service';
import { CatalogBreadcrumbItem } from '../../models/catalog-listing.model';

@Component({
  selector: 'app-catalog-breadcrumb',
  imports: [RouterLink, TranslateModule],
  templateUrl: './catalog-breadcrumb.component.html',
})
export class CatalogBreadcrumbComponent {
  private readonly language = inject(LanguageService);

  readonly items = input.required<CatalogBreadcrumbItem[]>();

  label(item: CatalogBreadcrumbItem): string {
    if (item.labelKey) {
      return item.labelKey;
    }
    const lang = this.language.currentLang();
    return lang === 'ar' && item.labelAr ? item.labelAr : (item.labelEn ?? '');
  }

  isTranslationKey(item: CatalogBreadcrumbItem): boolean {
    return !!item.labelKey;
  }
}
