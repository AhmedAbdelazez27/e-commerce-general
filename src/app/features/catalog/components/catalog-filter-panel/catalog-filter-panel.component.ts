import { Component, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageService } from '../../../../core/services/language.service';
import { CatalogListingFilters } from '../../models/catalog-listing.model';
import { CatalogListingFacade } from '../../services/catalog-listing.facade';

@Component({
  selector: 'app-catalog-filter-panel',
  imports: [TranslateModule],
  templateUrl: './catalog-filter-panel.component.html',
})
export class CatalogFilterPanelComponent {
  private readonly facade = inject(CatalogListingFacade);
  private readonly language = inject(LanguageService);

  /** `true` = desktop sidebar (live); `false` = mobile drawer (draft). */
  readonly live = input(true);

  readonly categories = this.facade.categories;
  readonly brands = this.facade.brands;
  readonly specifications = this.facade.specifications;
  readonly priceBounds = this.facade.priceBounds;

  readonly ratingOptions = [4, 3, 2, 1] as const;

  filters(): CatalogListingFilters {
    return this.live() ? this.facade.filters() : this.facade.draftFilters();
  }

  localizedName(item: { nameEn: string; nameAr: string }): string {
    return this.language.currentLang() === 'ar' ? item.nameAr : item.nameEn;
  }

  isCategoryChecked(id: string): boolean {
    return this.filters().categoryIds.includes(id);
  }

  isBrandChecked(id: string): boolean {
    return this.filters().brandIds.includes(id);
  }

  onCategoryChange(id: string): void {
    if (this.live()) {
      this.facade.toggleFilterCategory(id);
    } else {
      this.facade.toggleDraftCategory(id);
    }
  }

  onBrandChange(id: string): void {
    if (this.live()) {
      this.facade.toggleFilterBrand(id);
    } else {
      this.facade.toggleDraftBrand(id);
    }
  }

  onMinPriceChange(value: string): void {
    const parsed = value === '' ? null : Number(value);
    this.patch({ minPrice: Number.isFinite(parsed) ? parsed : null });
  }

  onMaxPriceChange(value: string): void {
    const parsed = value === '' ? null : Number(value);
    this.patch({ maxPrice: Number.isFinite(parsed) ? parsed : null });
  }

  onRatingChange(value: string): void {
    const parsed = value === '' ? null : Number(value);
    this.patch({ minRating: parsed });
  }

  onInStockChange(checked: boolean): void {
    this.patch({ inStockOnly: checked });
  }

  onOffersChange(checked: boolean): void {
    this.patch({ offersOnly: checked });
  }

  isSpecificationChecked(specificationId: number, value: string): boolean {
    return this.facade.isSpecificationChecked(specificationId, value, this.filters());
  }

  onSpecificationChange(specificationId: number, value: string): void {
    if (this.live()) {
      this.facade.toggleFilterSpecification(specificationId, value);
    } else {
      this.facade.toggleDraftSpecification(specificationId, value);
    }
  }

  private patch(partial: Partial<CatalogListingFilters>): void {
    if (this.live()) {
      this.facade.patchFilters(partial);
    } else {
      this.facade.patchDraftFilters(partial);
    }
  }
}
