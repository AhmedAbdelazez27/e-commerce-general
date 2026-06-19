import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageService } from '../../../../core/services/language.service';
import { SHOP_ROUTE } from '../../../../shared/utils/category-shop-link.util';
import { CatalogSubcategoryItem } from '../../models/catalog-listing.model';

@Component({
  selector: 'app-catalog-subcategory-rail',
  imports: [RouterLink, TranslateModule],
  templateUrl: './catalog-subcategory-rail.component.html',
})
export class CatalogSubcategoryRailComponent {
  private readonly language = inject(LanguageService);

  readonly items = input.required<CatalogSubcategoryItem[]>();
  readonly shopRoute = SHOP_ROUTE;

  label(item: CatalogSubcategoryItem): string {
    return this.language.currentLang() === 'ar' ? item.nameAr : item.nameEn;
  }

  queryParams(item: CatalogSubcategoryItem): Record<string, string> {
    const params: Record<string, string> = { categoryId: item.id };
    if (item.slug?.trim()) {
      params['category'] = item.slug.trim();
    }
    return params;
  }
}
