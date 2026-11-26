import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageService } from '../../../../core/services/language.service';
import { PortalConfigService } from '../../../../core/portal-config/portal-config.service';
import { resolveRichTextContent } from '../../../../shared/utils/product-rich-text.util';
import { ProductDetail, ProductDetailInfoTab, ProductDetailSpec } from '../../models/product-detail.model';

/** Collapsed product description length, in characters. */
const DESCRIPTION_PREVIEW_CHARS = 200;

function previewDescription(text: string, limit: number): string {
  if (text.length <= limit) {
    return text;
  }
  const window = text.slice(0, limit);
  const breakAt = window.lastIndexOf(' ');
  const cut = (breakAt >= Math.floor(limit * 0.7) ? window.slice(0, breakAt) : window).replace(
    /[\s,،.;:!?-]+$/u,
    '',
  );
  return `${cut}…`;
}

@Component({
  selector: 'app-product-detail-info',
  imports: [NgTemplateOutlet, TranslateModule],
  templateUrl: './product-detail-info.component.html',
})
export class ProductDetailInfoComponent {
  private readonly language = inject(LanguageService);
  private readonly portal = inject(PortalConfigService);
  private readonly document = inject(DOCUMENT);
  private readonly sanitizer = inject(DomSanitizer);

  readonly enableReturns = this.portal.enableReturns;

  readonly product = input.required<ProductDetail>();
  readonly activeTab = signal<ProductDetailInfoTab>('description');
  readonly descriptionExpanded = signal(false);

  private readonly howToUseContent = computed(() => {
    const product = this.product();
    const value =
      this.language.currentLang() === 'ar'
        ? product.howToUseAr || product.howToUse
        : product.howToUseEn || product.howToUse;
    return resolveRichTextContent(value, this.sanitizer, this.document);
  });

  readonly hasHowToUse = computed(() => this.howToUseContent().hasContent);
  readonly howToUseHtml = computed(() => this.howToUseContent().html);
  readonly howToUseText = computed(() => this.howToUseContent().text);

  constructor() {
    effect(() => {
      this.product();
      this.descriptionExpanded.set(false);
    });
  }

  readonly tabs = computed<ProductDetailInfoTab[]>(() => {
    const tabs: ProductDetailInfoTab[] = ['description', 'specifications', 'shipping'];
    if (this.hasHowToUse()) {
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

  private readonly descriptionContent = computed(() => {
    const product = this.product();
    const value = this.language.currentLang() === 'ar' ? product.descriptionAr : product.descriptionEn;
    return resolveRichTextContent(value, this.sanitizer, this.document);
  });

  readonly hasDescription = computed(() => this.descriptionContent().hasContent);

  readonly canExpandDescription = computed(() => this.descriptionContent().text.length > DESCRIPTION_PREVIEW_CHARS);

  readonly descriptionHtml = computed(() =>
    this.descriptionExpanded() || !this.canExpandDescription() ? this.descriptionContent().html : null,
  );

  readonly descriptionPreview = computed(() => {
    const text = this.descriptionContent().text;
    return this.descriptionExpanded() ? text : previewDescription(text, DESCRIPTION_PREVIEW_CHARS);
  });

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
