export interface PortalContactInfo {
  email: string;
  phone: string;
  whatsApp: string;
  supportEmail: string;
  supportPhone: string;
  addressAr: string;
  addressEn: string;
}

export interface PortalSocialMedia {
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  tikTokUrl: string;
  linkedInUrl: string;
  youTubeUrl: string;
  snapchatUrl: string;
}

export interface PortalSeoConfig {
  seoTitleAr: string;
  seoTitleEn: string;
  seoDescriptionAr: string;
  seoDescriptionEn: string;
  seoKeywords: string;
}

export interface PortalMobileSettings {
  enablePushNotifications: boolean;
  enableBiometricLogin: boolean;
  enableGuestCheckout: boolean;
  enableWishlist: boolean;
  enableReviews: boolean;
  enableChatSupport: boolean;
  forceUpdateVersion: string;
  minimumSupportedVersion: string;
}

export interface PortalWorkflowSettings {
  enableShipment: boolean;
  enableDeliveryTracking: boolean;
  enableReturns: boolean;
  enableRefunds: boolean;
  enableCashOnDelivery: boolean;
  enableOnlinePayment: boolean;
}

/** Runtime portal configuration (merged defaults + API). */
export interface PortalConfiguration {
  portalNameAr: string;
  portalNameEn: string;
  portalDescriptionAr: string;
  portalDescriptionEn: string;
  portalBaseUrl: string;
  logoUrl: string;
  darkLogoUrl: string;
  mobileLogoUrl: string;
  faviconUrl: string;
  splashScreenImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  /** @deprecated Use sectionBackgroundColor — kept for API backward compatibility */
  backgroundColor: string;
  sectionBackgroundColor: string;
  mainBackgroundColor: string;
  textColor: string;
  headerColor: string;
  footerColor: string;
  fontFamilyAr: string;
  fontFamilyEn: string;
  fontSizeBase: number;
  fontSizeHeading: number;
  fontSizeSmall: number;
  showFeaturedProducts: boolean;
  showBestSellers: boolean;
  showNewArrivals: boolean;
  showBrandsSection: boolean;
  showCategoriesSection: boolean;
  featuredProductsCount: number;
  bestSellerCount: number;
  newArrivalCount: number;
  addressAr: string;
  addressEn: string;
  contactInfo: PortalContactInfo;
  socialMedia: PortalSocialMedia;
  seo: PortalSeoConfig;
  mobileSettings: PortalMobileSettings;
  workflowSettings: PortalWorkflowSettings;
}

/** Raw API DTO — fields may be partial or omitted. */
export type PortalConfigurationDto = Partial<
  Omit<
    PortalConfiguration,
    'contactInfo' | 'socialMedia' | 'seo' | 'mobileSettings' | 'workflowSettings'
  >
> & {
  contactInfo?: Partial<PortalContactInfo>;
  socialMedia?: Partial<PortalSocialMedia>;
  seo?: Partial<PortalSeoConfig>;
  mobileSettings?: Partial<PortalMobileSettings>;
  workflowSettings?: Partial<PortalWorkflowSettings>;
};
