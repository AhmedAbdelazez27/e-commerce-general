import type { AppLang } from '../services/language.service';
import { PortalConfiguration } from './portal-configuration.model';

/** Resolve display address — prefers contactInfo, falls back to top-level API fields. */
export function resolvePortalAddress(config: PortalConfiguration, lang: AppLang): string {
  const contact = config.contactInfo;
  const ar = contact.addressAr?.trim() || config.addressAr?.trim() || '';
  const en = contact.addressEn?.trim() || config.addressEn?.trim() || '';

  if (lang === 'ar') {
    return ar || en;
  }
  return en || ar;
}

export function portalHasContactInfo(config: PortalConfiguration): boolean {
  const { email, phone, whatsApp, supportEmail, supportPhone } = config.contactInfo;
  return !!(
    email ||
    phone ||
    whatsApp ||
    supportEmail ||
    supportPhone ||
    resolvePortalAddress(config, 'en') ||
    resolvePortalAddress(config, 'ar')
  );
}
