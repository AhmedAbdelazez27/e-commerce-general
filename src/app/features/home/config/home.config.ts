import { HomePageConfig } from '../models/home.model';
import { HOME_BRANDS_MAX_ITEMS } from '../utils/home-brand.mapper';
import { HOME_PRODUCT_SECTION_MAX_ITEMS } from '../utils/home-product-search.util';

/** Home page structure — edit sections, copy keys, and routes here. */
export const HOME_PAGE_CONFIG: HomePageConfig = {
  hero: {
    autoPlay: true,
    autoPlayIntervalMs: 6000,
    fillViewport: true,
  },
  curatedCollections: {
    sectionEyebrowKey: 'HOME.CURATED.EYEBROW',
    sectionTitleKey: 'HOME.CURATED.TITLE',
    searchFilter: { isFeatured: true },
    maxItems: 3,
  },
  productSections: [
    // {
    //   id: 'most-searched',
    //   titleKey: 'HOME.MOST_SEARCHED.TITLE',
    //   subtitleKey: 'HOME.MOST_SEARCHED.SUBTITLE',
    //   viewAllRoute: '/shop',
    //   viewAllQuery: { sort: 'popular' },
    //   layout: 'scroll',
    // },
    {
      id: 'best-sellers',
      titleKey: 'HOME.BEST_SELLERS.TITLE',
      subtitleKey: 'HOME.BEST_SELLERS.SUBTITLE',
      viewAllRoute: '/shop',
      viewAllQuery: { sort: 'bestsellers' },
      layout: 'grid',
      searchFilter: { isBestSeller: true },
      maxItems: HOME_PRODUCT_SECTION_MAX_ITEMS,
    },
    {
      id: 'new-arrivals',
      titleKey: 'HOME.NEW_ARRIVALS.TITLE',
      subtitleKey: 'HOME.NEW_ARRIVALS.SUBTITLE',
      viewAllRoute: '/shop',
      viewAllQuery: { sort: 'new' },
      layout: 'grid',
      searchFilter: { isNewArrival: true },
      maxItems: HOME_PRODUCT_SECTION_MAX_ITEMS,
    },
  ],
  offers: [
    {
      id: 'welcome',
      titleKey: 'HOME.OFFERS.WELCOME_TITLE',
      subtitleKey: 'HOME.OFFERS.WELCOME_SUBTITLE',
      discountLabelKey: 'HOME.OFFERS.WELCOME_DISCOUNT',
      discountPercent: 10,
      ctaLabelKey: 'HOME.OFFERS.SHOP_NOW',
      route: '/shop',
      queryParams: { promo: 'welcome' },
      theme: 'accent',
    },
    {
      id: 'bazar',
      titleKey: 'HOME.OFFERS.BAZAR_TITLE',
      subtitleKey: 'HOME.OFFERS.BAZAR_SUBTITLE',
      ctaLabelKey: 'HOME.OFFERS.VIEW_DEALS',
      route: '/shop',
      queryParams: { category: 'bazar' },
      theme: 'primary',
    },
    {
      id: 'derma',
      titleKey: 'HOME.OFFERS.DERMA_TITLE',
      subtitleKey: 'HOME.OFFERS.DERMA_SUBTITLE',
      ctaLabelKey: 'HOME.OFFERS.EXPLORE',
      route: '/shop',
      queryParams: { category: 'skin-care' },
      theme: 'dark',
    },
  ],
  brands: {
    titleKey: 'HOME.BRANDS.TITLE',
    subtitleKey: 'HOME.BRANDS.SUBTITLE',
    viewAllRoute: '/brands',
    maxItems: HOME_BRANDS_MAX_ITEMS,
  },
  trustBadges: [
    {
      id: 'delivery',
      labelKey: 'HOME.TRUST.DELIVERY_TITLE',
      descriptionKey: 'HOME.TRUST.DELIVERY_DESC',
      iconClass: 'fa-solid fa-truck-fast',
    },
    {
      id: 'payment',
      labelKey: 'HOME.TRUST.PAYMENT_TITLE',
      descriptionKey: 'HOME.TRUST.PAYMENT_DESC',
      iconClass: 'fa-solid fa-lock',
    },
    {
      id: 'returns',
      labelKey: 'HOME.TRUST.RETURNS_TITLE',
      descriptionKey: 'HOME.TRUST.RETURNS_DESC',
      iconClass: 'fa-solid fa-rotate-left',
    },
    {
      id: 'support',
      labelKey: 'HOME.TRUST.SUPPORT_TITLE',
      descriptionKey: 'HOME.TRUST.SUPPORT_DESC',
      iconClass: 'fa-solid fa-headset',
    },
  ],
};
