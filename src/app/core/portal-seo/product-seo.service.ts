import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { PortalConfigService } from '../portal-config/portal-config.service';
import { PortalSeoService } from '../portal-seo/portal-seo.service';
import { AppLang } from '../services/language.service';
import type { PublicProductShareDto } from '../../features/catalog/models/product-share-info.model';

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

  applyProductShare(share: PublicProductShareDto, lang: AppLang): void {
    const pageTitle = (lang === 'ar' ? share.titleAr : share.titleEn).trim();
    const description = (lang === 'ar' ? share.descriptionAr : share.descriptionEn).trim();
    const imageUrl = share.imageUrl?.trim();
    const url = share.url.trim();

    if (pageTitle) {
      this.title.setTitle(pageTitle);
    }

    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
    }

    if (pageTitle) {
      this.meta.updateTag({ property: 'og:title', content: pageTitle });
      this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    }

    if (description) {
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({ name: 'twitter:description', content: description });
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

  clearProductShare(): void {
    for (const tag of this.ogTags) {
      if (tag.startsWith('og:')) {
        this.meta.removeTag(`property="${tag}"`);
      } else {
        this.meta.removeTag(`name="${tag}"`);
      }
    }
    this.portalSeo.apply(this.portalConfig.config());
  }
}
