/** Theme tokens from GetPortalConfiguration — applied at runtime via PortalThemeService. */
export interface PortalThemeTokens {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  /** Section surfaces — maps to --portal-background */
  backgroundColor: string;
  /** Page body — maps to --portal-body-bg */
  bodyBackgroundColor: string;
  textColor: string;
  headerColor: string;
  footerColor: string;
  fontFamilyAr: string;
  fontFamilyEn: string;
  fontSizeBase: number;
  fontSizeHeading: number;
  fontSizeSmall: number;
  borderRadius: string;
  faviconUrl: string;
}
