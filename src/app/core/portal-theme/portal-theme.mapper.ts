import { DEFAULT_STOREFRONT_CONFIG } from '../storefront-config/default-storefront-config';
import { PortalConfiguration } from '../portal-config/portal-configuration.model';
import { PortalThemeTokens } from './portal-theme.model';

const storefrontTheme = DEFAULT_STOREFRONT_CONFIG.theme;

/** Map portal configuration to theme tokens, keeping storefront defaults for non-API fields. */
export function mapPortalConfigurationToTheme(config: PortalConfiguration): PortalThemeTokens {
  return {
    primaryColor: config.primaryColor || storefrontTheme.primaryColor,
    secondaryColor: config.secondaryColor || storefrontTheme.secondaryColor,
    accentColor: config.accentColor || storefrontTheme.accentColor,
    successColor: storefrontTheme.successColor,
    dangerColor: storefrontTheme.dangerColor,
    warningColor: storefrontTheme.warningColor,
    backgroundColor: config.backgroundColor || storefrontTheme.backgroundColor || '#f9f9f7',
    textColor: config.textColor || '#1a1a1a',
    headerColor: config.headerColor || '#ffffff',
    footerColor: config.footerColor || config.primaryColor || storefrontTheme.primaryColor,
    fontFamilyAr: config.fontFamilyAr || storefrontTheme.fontFamily,
    fontFamilyEn: config.fontFamilyEn || storefrontTheme.fontFamily,
    fontSizeBase: config.fontSizeBase || 16,
    fontSizeHeading: config.fontSizeHeading || 30,
    fontSizeSmall: config.fontSizeSmall || 14,
    borderRadius: storefrontTheme.borderRadius,
    faviconUrl: config.faviconUrl,
  };
}
