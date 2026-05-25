import { Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { CatalogSortOption, CatalogViewMode } from '../../models/catalog-listing.model';

@Component({
  selector: 'app-catalog-listing-toolbar',
  imports: [TranslateModule],
  templateUrl: './catalog-listing-toolbar.component.html',
})
export class CatalogListingToolbarComponent {
  readonly sort = input.required<CatalogSortOption>();
  readonly viewMode = input.required<CatalogViewMode>();
  readonly productCount = input.required<number>();

  readonly sortChange = output<CatalogSortOption>();
  readonly viewModeChange = output<CatalogViewMode>();
  readonly openFilters = output<void>();

  readonly sortOptions: CatalogSortOption[] = [
    'featured',
    'price-asc',
    'price-desc',
    'newest',
    'rating',
    'name',
  ];

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as CatalogSortOption;
    this.sortChange.emit(value);
  }

  setViewMode(mode: CatalogViewMode): void {
    this.viewModeChange.emit(mode);
  }
}
