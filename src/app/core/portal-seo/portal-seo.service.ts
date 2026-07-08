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

  private portalConfig: PortalConfiguration | null = null;

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.portalConfig) {
        this.applySeo(this.portalConfig);
      }
    });
  }

  apply(config: PortalConfiguration): void {
    this.portalConfig = config;
    this.applySeo(config);
  }

  setPageTitle(pageTitle: string): void {
    const baseTitle = this.resolveBaseTitle();
    const trimmed = pageTitle.trim();
    if (!trimmed) {
      this.title.setTitle(baseTitle);
      return;
    }
    this.title.setTitle(baseTitle ? `${trimmed} | ${baseTitle}` : trimmed);
  }

  private applySeo(config: PortalConfiguration): void {
    const lang = this.language.currentLang() as AppLang;
    const seo = config.seo;
    const pageTitle =
      (lang === 'ar' ? seo.seoTitleAr : seo.seoTitleEn)?.trim() || this.portalName(config, lang);
    const description =
      (lang === 'ar' ? seo.seoDescriptionAr : seo.seoDescriptionEn)?.trim() ||
      (lang === 'ar' ? config.portalDescriptionAr : config.portalDescriptionEn)?.trim();

    if (pageTitle) {
      this.title.setTitle(pageTitle);
    }

    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
    }

    if (seo.seoKeywords?.trim()) {
      this.meta.updateTag({ name: 'keywords', content: seo.seoKeywords });
    }
  }

  private resolveBaseTitle(): string {
    if (!this.portalConfig) {
      return '';
    }
    return this.portalName(this.portalConfig, this.language.currentLang() as AppLang);
  }

  private portalName(config: PortalConfiguration, lang: AppLang): string {
    return (lang === 'ar' ? config.portalNameAr : config.portalNameEn)?.trim() ?? '';
  }
}
