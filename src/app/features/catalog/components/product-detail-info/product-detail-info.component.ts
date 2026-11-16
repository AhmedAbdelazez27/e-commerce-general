import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageService } from '../../../../core/services/language.service';
import { PortalConfigService } from '../../../../core/portal-config/portal-config.service';
import { ProductDetail, ProductDetailInfoTab, ProductDetailSpec } from '../../models/product-detail.model';
import { localizedHowToUse } from '../../utils/product-detail.util';

/** Collapsed product description length, in characters. */
const DESCRIPTION_PREVIEW_CHARS = 200;

function previewDescription(text: string, limit: number): string {
  const plain = text.replace(/\s+/g, ' ').trim();
  if (plain.length <= limit) {
    return plain;
  }
  const window = plain.slice(0, limit);
  const breakAt = window.lastIndexOf(' ');
  const cut = (breakAt >= Math.floor(limit * 0.7) ? window.slice(0, breakAt) : window).replace(
    /[\s,،.;:!?-]+$/u,
    '',
  );
  return `${cut}…`;
}

@Component({
  selector: 'app-product-detail-info',
  imports: [TranslateModule],
  templateUrl: './product-detail-info.component.html',
})
export class ProductDetailInfoComponent {
  private readonly language = inject(LanguageService);
  private readonly portal = inject(PortalConfigService);

  readonly enableReturns = this.portal.enableReturns;

  readonly product = input.required<ProductDetail>();
  readonly activeTab = signal<ProductDetailInfoTab>('description');
  readonly descriptionExpanded = signal(false);

  readonly howToUseText = computed(() => localizedHowToUse(this.product(), this.language.currentLang()));

  constructor() {
    effect(() => {
      this.product();
      this.descriptionExpanded.set(false);
    });
  }

  readonly tabs = computed<ProductDetailInfoTab[]>(() => {
    const tabs: ProductDetailInfoTab[] = ['description', 'specifications', 'shipping'];
    if (this.howToUseText()) {
      tabs.splice(1, 0, 'howToUse');
    }
    return tabs;
  });

  setTab(tab: ProductDetailInfoTab): void {
    this.activeTab.set(tab);
  }

  isActive(tab: ProductDetailInfoTab): boolean {
    const visible = this.tabs();
    const current = visible.includes(this.activeTab()) ? this.activeTab() : 'description';
    return current === tab;
  }

  description(): string {
    const p = this.product();
    return this.language.currentLang() === 'ar' ? p.descriptionAr : p.descriptionEn;
  }

  hasDescription(): boolean {
    return this.description().trim().length > 0;
  }

  descriptionPreview(): string {
    const full = this.description();
    return this.descriptionExpanded() ? full.replace(/\s+/g, ' ').trim() : previewDescription(full, DESCRIPTION_PREVIEW_CHARS);
  }

  canExpandDescription(): boolean {
    return this.description().replace(/\s+/g, ' ').trim().length > DESCRIPTION_PREVIEW_CHARS;
  }

  toggleDescription(): void {
    this.descriptionExpanded.update((open) => !open);
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
