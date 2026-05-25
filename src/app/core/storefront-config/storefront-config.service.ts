import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { SKIP_API_BASE } from '../http/http-context.tokens';
import { DEFAULT_STOREFRONT_CONFIG, STOREFRONT_CONFIG_URL } from './default-storefront-config';
import { mergeStorefrontConfig } from './storefront-config-merge.util';
import { StorefrontConfig, StorefrontThemeConfig } from './storefront-config.model';

@Injectable({ providedIn: 'root' })
export class StorefrontConfigService {
  private readonly http = inject(HttpClient);

  private readonly configSignal = signal<StorefrontConfig>(structuredClone(DEFAULT_STOREFRONT_CONFIG));
  private readonly loadedSignal = signal(false);
  private readonly loadErrorSignal = signal(false);

  readonly config = this.configSignal.asReadonly();
  readonly loaded = this.loadedSignal.asReadonly();
  readonly loadError = this.loadErrorSignal.asReadonly();
  readonly theme = computed(() => this.configSignal().theme);

  async load(): Promise<void> {
    try {
      const remote = await firstValueFrom(
        this.http.get<Partial<StorefrontConfig>>(STOREFRONT_CONFIG_URL, {
          headers: { 'Cache-Control': 'no-cache' },
          context: new HttpContext().set(SKIP_API_BASE, true),
        }),
      );
      this.configSignal.set(mergeStorefrontConfig(DEFAULT_STOREFRONT_CONFIG, remote));
      this.loadErrorSignal.set(false);
    } catch {
      this.configSignal.set(structuredClone(DEFAULT_STOREFRONT_CONFIG));
      this.loadErrorSignal.set(true);
    } finally {
      this.loadedSignal.set(true);
      this.applyThemeToDocument(this.configSignal().theme);
    }
  }

  private applyThemeToDocument(theme: StorefrontThemeConfig): void {
    const root = document.documentElement;
    root.style.setProperty('--store-primary', theme.primaryColor);
    root.style.setProperty('--store-secondary', theme.secondaryColor);
    root.style.setProperty('--store-accent', theme.accentColor);
    root.style.setProperty('--store-success', theme.successColor);
    root.style.setProperty('--store-danger', theme.dangerColor);
    root.style.setProperty('--store-warning', theme.warningColor);
    root.style.setProperty('--store-radius', theme.borderRadius);
    root.style.setProperty('--store-font-family', theme.fontFamily);
    if (theme.backgroundColor) {
      root.style.setProperty('--store-background', theme.backgroundColor);
    }
    root.style.setProperty('--bs-primary', theme.primaryColor);
    root.style.setProperty('--bs-secondary', theme.secondaryColor);
    root.style.setProperty('--bs-success', theme.successColor);
    root.style.setProperty('--bs-danger', theme.dangerColor);
    root.style.setProperty('--bs-warning', theme.warningColor);
    if (theme.backgroundColor) {
      root.style.setProperty('--bs-body-bg', theme.backgroundColor);
    }
  }
}

export function initStorefrontConfigFactory(svc: StorefrontConfigService): () => Promise<void> {
  return () => svc.load();
}
