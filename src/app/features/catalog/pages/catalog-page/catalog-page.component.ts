import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageService } from '../../../../core/services/language.service';
import { productDisplayName } from '../../../../core/utils/product-display.util';
import { ProductListItemDto } from '../../models/product.model';
import { CatalogApiService } from '../../services/catalog-api.service';

@Component({
  selector: 'app-catalog-page',
  imports: [DecimalPipe, RouterLink, TranslateModule],
  templateUrl: './catalog-page.component.html',
})
export class CatalogPageComponent implements OnInit {
  private readonly catalogApi = inject(CatalogApiService);
  private readonly language = inject(LanguageService);

  protected readonly products = signal<ProductListItemDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly productName = productDisplayName;

  ngOnInit(): void {
    this.catalogApi.getProducts().subscribe({
      next: (items) => {
        this.products.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected lang(): 'en' | 'ar' {
    return this.language.currentLang();
  }
}
