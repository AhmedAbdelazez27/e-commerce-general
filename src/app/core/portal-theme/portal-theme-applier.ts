import { AppLang } from '../services/language.service';
import { PortalThemeTokens } from './portal-theme.model';

function toCssFontSize(px: number): string {
  return `${px}px`;
}

function resolveFontFamily(theme: PortalThemeTokens, lang: AppLang): string {
  return lang === 'ar' ? theme.fontFamilyAr : theme.fontFamilyEn;
}

/** Apply portal theme tokens to document CSS variables (--portal-* only). */
export function applyPortalThemeToDocument(theme: PortalThemeTokens, lang: AppLang): void {
  const root = document.documentElement;
  const fontFamily = resolveFontFamily(theme, lang);

  root.style.setProperty('--portal-primary', theme.primaryColor);
  root.style.setProperty('--portal-secondary', theme.secondaryColor);
  root.style.setProperty('--portal-accent', theme.accentColor);
  root.style.setProperty('--portal-success', theme.successColor);
  root.style.setProperty('--portal-danger', theme.dangerColor);
  root.style.setProperty('--portal-warning', theme.warningColor);
  root.style.setProperty('--portal-radius', theme.borderRadius);
  root.style.setProperty('--portal-background', theme.backgroundColor);
  root.style.setProperty('--portal-text', theme.textColor);
  root.style.setProperty('--portal-header-bg', theme.headerColor);
  root.style.setProperty('--portal-footer-bg', theme.footerColor);
  root.style.setProperty('--portal-font-family-ar', theme.fontFamilyAr);
  root.style.setProperty('--portal-font-family-en', theme.fontFamilyEn);
  root.style.setProperty('--portal-font-family', fontFamily);
  root.style.setProperty('--portal-font-size-base', toCssFontSize(theme.fontSizeBase));
  root.style.setProperty('--portal-font-size-heading', toCssFontSize(theme.fontSizeHeading));
  root.style.setProperty('--portal-font-size-small', toCssFontSize(theme.fontSizeSmall));
}

/** Update active font family when language changes (portal theme step 1). */
export function applyPortalFontFamily(theme: PortalThemeTokens, lang: AppLang): void {
  document.documentElement.style.setProperty(
    '--portal-font-family',
    resolveFontFamily(theme, lang),
  );
}

export function applyPortalFavicon(faviconUrl: string | undefined): void {
  if (!faviconUrl?.trim()) {
    return;
  }

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = faviconUrl;
}
