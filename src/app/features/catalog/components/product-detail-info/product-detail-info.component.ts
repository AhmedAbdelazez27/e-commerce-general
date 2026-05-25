import { Component, inject, input, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageService } from '../../../../core/services/language.service';
import { ProductDetail, ProductDetailInfoTab, ProductDetailSpec } from '../../models/product-detail.model';

@Component({
  selector: 'app-product-detail-info',
  imports: [TranslateModule],
  templateUrl: './product-detail-info.component.html',
})
export class ProductDetailInfoComponent {
  private readonly language = inject(LanguageService);

  readonly product = input.required<ProductDetail>();
  readonly activeTab = signal<ProductDetailInfoTab>('description');

  readonly tabs: ProductDetailInfoTab[] = ['description', 'specifications', 'shipping'];

  setTab(tab: ProductDetailInfoTab): void {
    this.activeTab.set(tab);
  }

  isActive(tab: ProductDetailInfoTab): boolean {
    return this.activeTab() === tab;
  }

  description(): string {
    const p = this.product();
    return this.language.currentLang() === 'ar' ? p.descriptionAr : p.descriptionEn;
  }

  shippingText(): string {
    const p = this.product();
    return this.language.currentLang() === 'ar' ? p.shippingInfoAr : p.shippingInfoEn;
  }

  returnsText(): string {
    const p = this.product();
    return this.language.currentLang() === 'ar' ? p.returnsInfoAr : p.returnsInfoEn;
  }

  specLabel(spec: ProductDetailSpec): string {
    return this.language.currentLang() === 'ar' ? spec.labelAr : spec.labelEn;
  }

  specValue(spec: ProductDetailSpec): string {
    return this.language.currentLang() === 'ar' ? spec.valueAr : spec.valueEn;
  }
}
