import { DEFAULT_STOREFRONT_CONFIG } from '../storefront-config/default-storefront-config';
import { PortalConfiguration } from '../portal-config/portal-configuration.model';
import { PORTAL_THEME_COLOR_DEFAULTS } from './portal-theme.defaults';
import { PortalThemeTokens } from './portal-theme.model';

const storefrontTheme = DEFAULT_STOREFRONT_CONFIG.theme;

function resolveColor(value: string | undefined | null, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.startsWith('var(--')) {
    return fallback;
  }
  return trimmed;
}

/** Map portal configuration to theme tokens (API-driven colors only). */
export function mapPortalConfigurationToTheme(config: PortalConfiguration): PortalThemeTokens {
  return {
    primaryColor: resolveColor(config.primaryColor, PORTAL_THEME_COLOR_DEFAULTS.primary),
    secondaryColor: resolveColor(config.secondaryColor, PORTAL_THEME_COLOR_DEFAULTS.secondary),
    accentColor: resolveColor(config.accentColor, PORTAL_THEME_COLOR_DEFAULTS.accent),
    backgroundColor: resolveColor(
      config.sectionBackgroundColor || config.backgroundColor,
      PORTAL_THEME_COLOR_DEFAULTS.sectionBackground,
    ),
    bodyBackgroundColor: resolveColor(
      config.mainBackgroundColor || config.backgroundColor,
      PORTAL_THEME_COLOR_DEFAULTS.mainBackground,
    ),
    textColor: resolveColor(config.textColor, PORTAL_THEME_COLOR_DEFAULTS.text),
    headerColor: resolveColor(
      config.headerColor || config.sectionBackgroundColor,
      PORTAL_THEME_COLOR_DEFAULTS.header,
    ),
    footerColor: resolveColor(config.footerColor, PORTAL_THEME_COLOR_DEFAULTS.footer),
    fontFamilyAr: config.fontFamilyAr?.trim() || storefrontTheme.fontFamily,
    fontFamilyEn: config.fontFamilyEn?.trim() || storefrontTheme.fontFamily,
    fontSizeBase: config.fontSizeBase || 16,
    fontSizeHeading: config.fontSizeHeading || 30,
    fontSizeSmall: config.fontSizeSmall || 14,
    borderRadius: storefrontTheme.borderRadius || PORTAL_THEME_COLOR_DEFAULTS.borderRadius,
    faviconUrl: config.faviconUrl,
  };
}
