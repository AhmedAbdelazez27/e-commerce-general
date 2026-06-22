import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PortalConfiguration } from '../portal-config/portal-configuration.model';
import { AppLang, LanguageService } from '../services/language.service';

@Injectable({ providedIn: 'root' })
export class PortalSeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  private seoConfig: PortalConfiguration['seo'] | null = null;

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.seoConfig) {
        this.applySeo(this.seoConfig);
      }
    });
  }

  apply(config: PortalConfiguration): void {
    this.seoConfig = config.seo;
    this.applySeo(config.seo);
  }

  private applySeo(seo: PortalConfiguration['seo']): void {
    const lang = this.language.currentLang() as AppLang;
    const pageTitle = lang === 'ar' ? seo.seoTitleAr : seo.seoTitleEn;
    const description = lang === 'ar' ? seo.seoDescriptionAr : seo.seoDescriptionEn;

    if (pageTitle?.trim()) {
      this.title.setTitle(pageTitle);
    }

    if (description?.trim()) {
      this.meta.updateTag({ name: 'description', content: description });
    }

    if (seo.seoKeywords?.trim()) {
      this.meta.updateTag({ name: 'keywords', content: seo.seoKeywords });
    }
  }
}
