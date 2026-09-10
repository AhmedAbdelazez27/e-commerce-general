import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import type { ProductDetail } from '../../features/catalog/models/product-detail.model';
import { pickProductDetailPosterUrl } from '../../features/catalog/utils/catalog-media.util';
import type { PublicProductShareDto } from '../../features/catalog/models/product-share-info.model';
import { PortalConfigService } from '../portal-config/portal-config.service';
import { PortalSeoService } from '../portal-seo/portal-seo.service';
import { AppLang } from '../services/language.service';
import { resolveProductPosterUrl } from '../../shared/utils/storefront-media.util';

@Injectable({ providedIn: 'root' })
export class ProductSeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly portalSeo = inject(PortalSeoService);
  private readonly portalConfig = inject(PortalConfigService);

  private readonly ogTags = [
    'og:title',
    'og:description',
    'og:image',
    'og:url',
    'og:type',
    'twitter:card',
    'twitter:title',
    'twitter:description',
    'twitter:image',
  ];

  applyProductPage(
    share: PublicProductShareDto | null,
    lang: AppLang,
    product?: ProductDetail | null,
  ): void {
    const productName = product
      ? (lang === 'ar' ? product.nameAr : product.nameEn).trim()
      : '';
    const shareTitle = share
      ? (lang === 'ar' ? share.titleAr : share.titleEn).trim()
      : '';
    const shareDescription = share
      ? (lang === 'ar' ? share.descriptionAr : share.descriptionEn).trim()
      : '';
    const productDescription =
      product?.metaDescription?.trim() ||
      (lang === 'ar' ? product?.descriptionAr : product?.descriptionEn)?.trim() ||
      '';

    const pageTitle = firstNonEmpty(
      share?.metaTitle,
      product?.metaTitle,
      shareTitle,
      productName,
    );
    const description = firstNonEmpty(
      share?.metaDescription,
      product?.metaDescription,
      shareDescription,
      productDescription,
    );
    const keywords = firstNonEmpty(share?.metaKeywords, product?.metaKeywords);
    const imageUrl =
      resolveProductPosterUrl(share?.imageUrl) ||
      (product ? pickProductDetailPosterUrl(product.images) : undefined);
    const url = share?.url.trim() ?? '';

    if (pageTitle) {
      this.title.setTitle(pageTitle);
      this.meta.updateTag({ property: 'og:title', content: pageTitle });
      this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    }

    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({ name: 'twitter:description', content: description });
    }

    if (keywords) {
      this.meta.updateTag({ name: 'keywords', content: keywords });
    } else {
      this.meta.removeTag('name="keywords"');
    }

    if (imageUrl) {
      this.meta.updateTag({ property: 'og:image', content: imageUrl });
      this.meta.updateTag({ name: 'twitter:image', content: imageUrl });
    }

    if (url) {
      this.meta.updateTag({ property: 'og:url', content: url });
    }

    this.meta.updateTag({ property: 'og:type', content: 'product' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
  }

  /** @deprecated Use applyProductPage. */
  applyProductShare(share: PublicProductShareDto, lang: AppLang): void {
    this.applyProductPage(share, lang);
  }

  clearProductShare(): void {
    for (const tag of this.ogTags) {
      if (tag.startsWith('og:')) {
        this.meta.removeTag(`property="${tag}"`);
      } else {
        this.meta.removeTag(`name="${tag}"`);
      }
    }
    this.meta.removeTag('name="keywords"');
    this.portalSeo.apply(this.portalConfig.config());
  }
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
}
