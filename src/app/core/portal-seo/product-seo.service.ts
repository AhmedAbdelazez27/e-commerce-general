import { Injectable, inject } from '@angular/core';

import type { ProductDetail } from '../../features/catalog/models/product-detail.model';
import { pickProductDetailPosterUrl } from '../../features/catalog/utils/catalog-media.util';
import type { PublicProductShareDto } from '../../features/catalog/models/product-share-info.model';
import { PortalConfigService } from '../portal-config/portal-config.service';
import { PortalSeoService, toPlainSeoText } from '../portal-seo/portal-seo.service';
import { AppLang } from '../services/language.service';
import { resolveProductPosterUrl } from '../../shared/utils/storefront-media.util';

@Injectable({ providedIn: 'root' })
export class ProductSeoService {
  private readonly portalSeo = inject(PortalSeoService);
  private readonly portalConfig = inject(PortalConfigService);

  applyProductPage(
    share: PublicProductShareDto | null,
    lang: AppLang,
    product?: ProductDetail | null,
  ): void {
    const productName = product ? (lang === 'ar' ? product.nameAr : product.nameEn).trim() : '';
    const shareTitle = share ? (lang === 'ar' ? share.titleAr : share.titleEn).trim() : '';
    const localizedDescription = product
      ? (lang === 'ar' ? product.descriptionAr : product.descriptionEn)
      : share
        ? lang === 'ar'
          ? share.descriptionAr
          : share.descriptionEn
        : '';

    const pageTitle =
      firstNonEmpty(product?.metaTitle, share?.metaTitle) ||
      this.portalSeo.fallbackTitle(productName || shareTitle);
    const description =
      firstNonEmpty(product?.metaDescription, share?.metaDescription) ||
      toPlainSeoText(localizedDescription);
    const keywords = firstNonEmpty(product?.metaKeywords, share?.metaKeywords);
    const imageUrl =
      resolveProductPosterUrl(share?.imageUrl) ||
      (product ? pickProductDetailPosterUrl(product.images) : undefined);

    this.portalSeo.applyResolvedMeta({
      title: pageTitle,
      description,
      keywords: keywords || undefined,
      imageUrl,
      canonicalPath: product ? productCanonicalPath(product) : null,
      ogType: 'product',
    });
  }

  /** @deprecated Use applyProductPage. */
  applyProductShare(share: PublicProductShareDto, lang: AppLang): void {
    this.applyProductPage(share, lang);
  }

  clearProductShare(): void {
    this.portalSeo.apply(this.portalConfig.config());
  }
}

function productCanonicalPath(product: { id: number; slug?: string | null }): string | null {
  const slug = product.slug?.trim();
  if (slug) {
    return `/shop/${encodeURIComponent(slug)}`;
  }
  if (product.id > 0) {
    return `/shop?p=${product.id}`;
  }
  return null;
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
