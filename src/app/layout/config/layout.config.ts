import { StoreLayoutConfig } from '../models/layout.model';

/** Global storefront layout — edit here to change promos, footer links, and branding paths. */
export const LAYOUT_CONFIG: StoreLayoutConfig = {
  branding: {
    logoSrc: '/images/Logo.png',
    logoAltKey: 'LAYOUT.LOGO_ALT',
    homeRoute: '/home',
  },
  announcement: {
    enabled: true,
    rotateIntervalMs: 4500,
    messages: [
      {
        id: 'free-delivery',
        labelKey: 'LAYOUT.ANNOUNCEMENT.DELIVERY_LABEL',
        translationKey: 'LAYOUT.ANNOUNCEMENT.DELIVERY_MSG',
        translationParams: { amount: '50' },
        linkLabelKey: 'LAYOUT.ANNOUNCEMENT.SHOP_NOW',
        linkRoute: '/shop',
      },
      {
        id: 'beauty-code',
        labelKey: 'LAYOUT.ANNOUNCEMENT.CODE_LABEL',
        translationKey: 'LAYOUT.ANNOUNCEMENT.CODE_MSG',
        translationParams: { code: 'LECOSMA15', percent: '15' },
        linkLabelKey: 'LAYOUT.ANNOUNCEMENT.APPLY_CODE',
        linkRoute: '/cart',
      },
      {
        id: 'welcome-code',
        labelKey: 'LAYOUT.ANNOUNCEMENT.WELCOME_LABEL',
        translationKey: 'LAYOUT.ANNOUNCEMENT.WELCOME_CODE',
        translationParams: { code: 'WELCOME', percent: '10' },
        linkLabelKey: 'LAYOUT.ANNOUNCEMENT.SHOP_NOW',
        linkRoute: '/shop',
        linkQueryParams: { promo: 'welcome' },
      },
    ],
  },
  header: {
    searchPlaceholderKey: 'LAYOUT.SEARCH_PLACEHOLDER',
    shopRoute: '/shop',
    wishlistRoute: '/shop',
    cartRoute: '/cart',
    loginRoute: '/auth/login',
    accountRoute: '/account/profile',
  },
  footer: {
    companyLinks: [
      { id: 'about', labelKey: 'LAYOUT.FOOTER.ABOUT', route: '/home' },
      { id: 'brands', labelKey: 'LAYOUT.FOOTER.BRANDS', route: '/brands' },
      { id: 'shop', labelKey: 'LAYOUT.FOOTER.SHOP', route: '/shop' },
    ],
    customerServiceLinks: [
      { id: 'orders', labelKey: 'LAYOUT.FOOTER.ORDERS', route: '/account/orders' },
      { id: 'contact', labelKey: 'LAYOUT.FOOTER.CONTACT', route: '/home' },
      { id: 'faq', labelKey: 'LAYOUT.FOOTER.FAQ', route: '/home' },
    ],
    socialLinks: [
      {
        id: 'instagram',
        labelKey: 'LAYOUT.FOOTER.SOCIAL_INSTAGRAM',
        href: '#',
        iconClass: 'fa-brands fa-instagram',
      },
      {
        id: 'facebook',
        labelKey: 'LAYOUT.FOOTER.SOCIAL_FACEBOOK',
        href: '#',
        iconClass: 'fa-brands fa-facebook-f',
      },
      {
        id: 'tiktok',
        labelKey: 'LAYOUT.FOOTER.SOCIAL_TIKTOK',
        href: '#',
        iconClass: 'fa-brands fa-tiktok',
      },
    ],
    trustItems: [
      { id: 'cod', labelKey: 'LAYOUT.FOOTER.TRUST_COD', iconClass: 'fa-solid fa-hand-holding-dollar' },
      { id: 'shipping', labelKey: 'LAYOUT.FOOTER.TRUST_SHIPPING', iconClass: 'fa-solid fa-truck-fast' },
      { id: 'quality', labelKey: 'LAYOUT.FOOTER.TRUST_QUALITY', iconClass: 'fa-solid fa-award' },
      { id: 'support', labelKey: 'LAYOUT.FOOTER.TRUST_SUPPORT', iconClass: 'fa-solid fa-headset' },
    ],
    newsletter: {
      enabled: true,
      titleKey: 'LAYOUT.FOOTER.NEWSLETTER_TITLE',
      subtitleKey: 'LAYOUT.FOOTER.NEWSLETTER_SUBTITLE',
      placeholderKey: 'LAYOUT.FOOTER.NEWSLETTER_PLACEHOLDER',
      buttonKey: 'LAYOUT.FOOTER.NEWSLETTER_BUTTON',
    },
  },
};
