import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

import { PortalConfiguration } from '../portal-config/portal-configuration.model';
import { AppLang, LanguageService } from '../services/language.service';

const PRIVATE_PATH = /^\/(cart|checkout|account|auth|wishlist|notifications)(\/|$)/;

@Injectable({ providedIn: 'root' })
export class PortalSeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  private portalConfig: PortalConfiguration | null = null;
  private pageOverride = false;

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.portalConfig && !this.pageOverride) {
        this.applySeo(this.portalConfig);
      }
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.syncRouteSeo(event.urlAfterRedirects));
  }

  apply(config: PortalConfiguration): void {
    this.portalConfig = config;
    this.pageOverride = false;
    this.applySeo(config);
    this.syncRouteSeo(this.router.url);
  }

  setPageTitle(pageTitle: string): void {
    const baseTitle = this.resolveBaseTitle();
    const trimmed = pageTitle.trim();
    const nextTitle = !trimmed ? baseTitle : baseTitle ? `${trimmed} | ${baseTitle}` : trimmed;
    if (nextTitle) {
      this.title.setTitle(nextTitle);
      this.setOrRemoveProperty('og:title', nextTitle);
      this.setOrRemoveName('twitter:title', nextTitle);
    }
  }

  applyPageMeta(pageTitle: string, description?: string | null): void {
    this.setPageTitle(pageTitle);
    this.setOrRemoveName('description', description);
    this.setOrRemoveProperty('og:description', description);
    this.setOrRemoveName('twitter:description', description);
  }

  /** Title and description are already resolved. The store name is not appended again. */
  applyResolvedMeta(options: ResolvedPageSeo): void {
    this.pageOverride = true;
    const pageTitle = options.title.trim();
    if (pageTitle) {
      this.title.setTitle(pageTitle);
    }

    this.setOrRemoveName('description', options.description);
    this.setOrRemoveName(
      'keywords',
      options.keywords === undefined ? this.portalConfig?.seo.seoKeywords : options.keywords,
    );
    this.setOrRemoveProperty('og:title', pageTitle);
    this.setOrRemoveName('twitter:title', pageTitle);
    this.setOrRemoveProperty('og:description', options.description);
    this.setOrRemoveName('twitter:description', options.description);
    this.setOrRemoveProperty('og:image', options.imageUrl);
    this.setOrRemoveName('twitter:image', options.imageUrl);
    this.meta.updateTag({ property: 'og:type', content: options.ogType ?? 'website' });
    this.meta.updateTag({
      name: 'twitter:card',
      content: options.imageUrl?.trim() ? 'summary_large_image' : 'summary',
    });
    this.setCanonical(options.canonicalPath ?? null);
    this.applyRobots(this.router.url);
  }

  fallbackTitle(name: string): string {
    const trimmed = name.trim();
    const store = this.storeName();
    if (!trimmed) {
      return store;
    }
    return store ? `${trimmed} | ${store}` : trimmed;
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

    this.setOrRemoveName('description', description);
    this.setOrRemoveName('keywords', seo.seoKeywords);
    this.setOrRemoveProperty('og:title', pageTitle);
    this.setOrRemoveName('twitter:title', pageTitle);
    this.setOrRemoveProperty('og:description', description);
    this.setOrRemoveName('twitter:description', description);
    this.setOrRemoveProperty('og:image', null);
    this.setOrRemoveName('twitter:image', null);
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
  }

  private syncRouteSeo(url: string): void {
    this.applyRobots(url);
    if (!this.pageOverride) {
      this.setCanonical(canonicalPathForUrl(url));
    }
  }

  private applyRobots(url: string): void {
    const content = isPrivatePath(urlPath(url)) ? 'noindex,follow' : 'index,follow';
    this.meta.updateTag({ name: 'robots', content });
  }

  private setCanonical(path: string | null): void {
    const head = this.document.head;
    if (!head) {
      return;
    }

    const links = Array.from(head.querySelectorAll('link[rel="canonical"]'));
    if (!path) {
      for (const link of links) {
        link.remove();
      }
      this.setOrRemoveProperty('og:url', null);
      return;
    }

    const href = this.absoluteUrl(path);
    let link = links[0] as HTMLLinkElement | undefined;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', href);
    for (const extra of links.slice(1)) {
      extra.remove();
    }
    this.setOrRemoveProperty('og:url', href);
  }

  private absoluteUrl(path: string): string {
    const origin = this.document.location?.origin;
    if (!origin || origin === 'null') {
      return path;
    }
    return new URL(path, origin).href;
  }

  private setOrRemoveName(name: string, content?: string | null): void {
    const value = content?.trim() ?? '';
    if (!value) {
      this.meta.removeTag(`name="${name}"`);
      return;
    }
    this.meta.updateTag({ name, content: value });
  }

  private setOrRemoveProperty(property: string, content?: string | null): void {
    const value = content?.trim() ?? '';
    if (!value) {
      this.meta.removeTag(`property="${property}"`);
      return;
    }
    this.meta.updateTag({ property, content: value });
  }

  private resolveBaseTitle(): string {
    if (!this.portalConfig) {
      return '';
    }
    return this.portalName(this.portalConfig, this.language.currentLang() as AppLang);
  }

  private storeName(): string {
    if (!this.portalConfig) {
      return '';
    }
    return this.portalName(this.portalConfig, this.language.currentLang() as AppLang);
  }

  private portalName(config: PortalConfiguration, lang: AppLang): string {
    return (lang === 'ar' ? config.portalNameAr : config.portalNameEn)?.trim() ?? '';
  }
}

export interface ResolvedPageSeo {
  title: string;
  description?: string | null;
  keywords?: string | null;
  imageUrl?: string | null;
  canonicalPath?: string | null;
  ogType?: string;
}

export function toPlainSeoText(value?: string | null): string {
  if (!value) {
    return '';
  }
  const withoutTags = value.replace(/<[^>]*>/g, ' ');
  const decoded = withoutTags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
  return decoded.replace(/\s+/g, ' ').trim();
}

function urlPath(url: string): string {
  const path = url.split(/[?#]/)[0] || '/';
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

function isPrivatePath(path: string): boolean {
  return path === '/login' || PRIVATE_PATH.test(path);
}

export function canonicalPathForUrl(url: string): string | null {
  const [rawPath, query = ''] = url.split('#')[0].split('?');
  const path = urlPath(rawPath || '/');
  if (isPrivatePath(path)) {
    return null;
  }
  if (path === '/' || path === '/home') {
    return '/home';
  }
  if (path.startsWith('/shop/')) {
    return path;
  }
  if (path === '/shop') {
    const params = new URLSearchParams(query);
    const category = params.get('category')?.trim();
    const categoryId = params.get('categoryId')?.trim();
    if (category || categoryId) {
      const next = new URLSearchParams();
      if (category) {
        next.set('category', category);
      }
      if (categoryId) {
        next.set('categoryId', categoryId);
      }
      return `/shop?${next.toString()}`;
    }
    const productId = params.get('p')?.trim();
    if (productId && /^\d+$/.test(productId)) {
      return `/shop?p=${productId}`;
    }
    return '/shop';
  }
  return path;
}
