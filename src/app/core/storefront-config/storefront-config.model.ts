/** Theme colors only — loaded from `public/config/storefront.config.json`. */
export interface StorefrontThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  successColor: string;
  dangerColor: string;
  warningColor: string;
  backgroundColor?: string;
  fontFamily: string;
  borderRadius: string;
}

export interface StorefrontConfig {
  theme: StorefrontThemeConfig;
}
