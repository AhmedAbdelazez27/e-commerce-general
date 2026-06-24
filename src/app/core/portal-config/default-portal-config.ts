import { HOME_BRANDS_MAX_ITEMS } from '../../features/home/utils/home-brand.mapper';
import { HOME_PRODUCT_SECTION_MAX_ITEMS } from '../../features/home/utils/home-product-search.util';
import { DEFAULT_STOREFRONT_CONFIG } from '../storefront-config/default-storefront-config';
import { LAYOUT_CONFIG } from '../../layout/config/layout.config';
import { PortalConfiguration } from './portal-configuration.model';

const theme = DEFAULT_STOREFRONT_CONFIG.theme;

/** Defaults aligned with static layout/home config and storefront theme. */
export const DEFAULT_PORTAL_CONFIG: PortalConfiguration = {
  portalNameAr: 'متجر إلكتروني',
  portalNameEn: 'E-Commerce Store',
  portalDescriptionAr: '',
  portalDescriptionEn: '',
  logoUrl: LAYOUT_CONFIG.branding.logoSrc,
  darkLogoUrl: LAYOUT_CONFIG.branding.logoSrc,
  mobileLogoUrl: LAYOUT_CONFIG.branding.logoSrc,
  faviconUrl: '',
  splashScreenImageUrl: '',
  primaryColor: theme.primaryColor,
  secondaryColor: theme.secondaryColor,
  accentColor: theme.accentColor,
  backgroundColor: theme.backgroundColor ?? 'var(--portal-background)',
  textColor: '#1a1a1a',
  headerColor: 'var(--portal-background)',
  footerColor: theme.primaryColor,
  fontFamilyAr: theme.fontFamily,
  fontFamilyEn: theme.fontFamily,
  fontSizeBase: 16,
  fontSizeHeading: 30,
  fontSizeSmall: 14,
  showFeaturedProducts: true,
  showBestSellers: true,
  showNewArrivals: true,
  showBrandsSection: true,
  showCategoriesSection: true,
  featuredProductsCount: 3,
  bestSellerCount: HOME_PRODUCT_SECTION_MAX_ITEMS,
  newArrivalCount: HOME_PRODUCT_SECTION_MAX_ITEMS,
  contactInfo: {
    email: '',
    phone: '',
    whatsApp: '',
    supportEmail: '',
    supportPhone: '',
  },
  socialMedia: {
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    tikTokUrl: '',
    linkedInUrl: '',
    youTubeUrl: '',
    snapchatUrl: '',
  },
  seo: {
    seoTitleAr: 'متجر إلكتروني',
    seoTitleEn: 'E-Commerce Store',
    seoDescriptionAr: '',
    seoDescriptionEn: '',
    seoKeywords: '',
  },
  mobileSettings: {
    enablePushNotifications: false,
    enableBiometricLogin: false,
    enableGuestCheckout: false,
    enableWishlist: true,
    enableReviews: true,
    enableChatSupport: false,
    forceUpdateVersion: '',
    minimumSupportedVersion: '',
  },
};
