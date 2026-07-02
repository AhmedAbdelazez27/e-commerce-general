import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { LAYOUT_CONFIG } from '../../layout/config/layout.config';
import { SocialLink } from '../../layout/models/layout.model';
import { AppLang } from '../services/language.service';
import { StorefrontConfigService } from '../storefront-config/storefront-config.service';
import { DEFAULT_PORTAL_CONFIG } from './default-portal-config';
import { EcPublicSettingsApiService } from './ec-public-settings-api.service';
import { mergePortalConfig } from './portal-config-merge.util';
import {
  normalizePortalConfigurationDto,
  resolvePortalSocialLinks,
} from './portal-config.mapper';
import { PortalConfiguration } from './portal-configuration.model';
import { portalHasContactInfo } from './portal-contact.util';
import { PortalThemeService } from '../portal-theme/portal-theme.service';
import {
  pickPortalAttachmentBaseUrl,
  setAttachmentBaseUrl,
} from '../utils/attachment-url.util';
import { APP_ENVIRONMENT } from '../tokens/app-environment.token';

/** Loads branding content from GetPortalConfiguration (logo, social, contact). */
@Injectable({ providedIn: 'root' })
export class PortalConfigService {
  private readonly api = inject(EcPublicSettingsApiService);
  private readonly storefrontConfig = inject(StorefrontConfigService);
  private readonly portalTheme = inject(PortalThemeService);
  private readonly env = inject(APP_ENVIRONMENT);

  private readonly configSignal = signal<PortalConfiguration>(structuredClone(DEFAULT_PORTAL_CONFIG));
  private readonly loadedSignal = signal(false);
  private readonly loadErrorSignal = signal(false);

  readonly config = this.configSignal.asReadonly();
  readonly loaded = this.loadedSignal.asReadonly();
  readonly loadError = this.loadErrorSignal.asReadonly();

  readonly socialLinks = computed<SocialLink[]>(() =>
    resolvePortalSocialLinks(this.configSignal().socialMedia, LAYOUT_CONFIG.footer.socialLinks),
  );

  readonly hasContactInfo = computed(() => portalHasContactInfo(this.configSignal()));

  readonly chatSupportHref = computed(() => {
    const { whatsApp, supportPhone, phone } = this.configSignal().contactInfo;
    const raw = whatsApp || supportPhone || phone;
    if (!raw) {
      return null;
    }
    const digits = raw.replace(/\D/g, '');
    return digits ? `https://wa.me/${digits}` : null;
  });

  readonly enableChatSupport = computed(() => this.configSignal().mobileSettings.enableChatSupport);

  readonly enableReturns = computed(() => this.configSignal().workflowSettings.enableReturns);

  readonly enableShipment = computed(() => this.configSignal().workflowSettings.enableShipment);

  async load(): Promise<void> {
    await this.storefrontConfig.load();

    try {
      const remote = await firstValueFrom(this.api.getPortalConfiguration());
      if (remote) {
        this.configSignal.set(
          mergePortalConfig(DEFAULT_PORTAL_CONFIG, normalizePortalConfigurationDto(remote)),
        );
        this.loadErrorSignal.set(false);
      } else {
        this.loadErrorSignal.set(true);
      }
    } catch {
      this.loadErrorSignal.set(true);
    } finally {
      this.syncAttachmentBaseUrl();
      this.portalTheme.apply(this.configSignal());
      this.loadedSignal.set(true);
    }
  }

  private syncAttachmentBaseUrl(): void {
    const config = this.configSignal();
    setAttachmentBaseUrl(
      pickPortalAttachmentBaseUrl(config.portalBaseUrl) || this.env.attachmentsBaseUrl || '',
    );
  }

  portalName(lang: AppLang): string {
    const config = this.configSignal();
    return lang === 'ar' ? config.portalNameAr : config.portalNameEn;
  }

  logoSrc(): string {
    return this.configSignal().logoUrl || LAYOUT_CONFIG.branding.logoSrc;
  }

  mobileLogoSrc(): string {
    const config = this.configSignal();
    return config.mobileLogoUrl || config.logoUrl || LAYOUT_CONFIG.branding.logoSrc;
  }
}

export function initPortalConfigFactory(svc: PortalConfigService): () => Promise<void> {
  return () => svc.load();
}
