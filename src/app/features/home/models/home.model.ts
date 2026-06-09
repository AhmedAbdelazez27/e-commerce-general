import { StorefrontProduct } from '../../../shared/models/storefront-product.model';

export interface HomeHeroSlide {
  id: string;
  imageSrc: string;
  /** i18n key — used when `imageAlt` is not set. */
  imageAltKey?: string;
  imageAlt?: string;
  eyebrowKey?: string;
  /** i18n key — used when `headline` is not set. */
  headlineKey?: string;
  headline?: string;
  /** i18n key — used when `subtitle` is not set. */
  subtitleKey?: string;
  subtitle?: string;
  /** i18n key — used when `ctaLabel` is not set. */
  ctaLabelKey?: string;
  ctaLabel?: string;
  ctaRoute: string;
  ctaQuery?: Record<string, string>;
  secondaryCtaLabelKey?: string;
  secondaryCtaRoute?: string;
  secondaryCtaQuery?: Record<string, string>;
}

export interface HomeHeroConfig {
  /** Fallback slides when the API returns none or fails. */
  slides?: HomeHeroSlide[];
  autoPlay?: boolean;
  autoPlayIntervalMs?: number;
  /** Fill space below announcement + header + nav to complete 100svh (home page). */
  fillViewport?: boolean;
  /** Fixed slider height when `fillViewport` is false (e.g. `"20rem"`). */
  height?: string;
  /** Slider height from tablet up when `fillViewport` is false. */
  heightMd?: string;
}

export interface HomeCategoryShortcut {
  id: string;
  labelKey?: string;
  nameEn?: string;
  nameAr?: string;
  description?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  route: string | string[];
  queryParams?: Record<string, string>;
  iconClass?: string;
  productCount: number;
  imageUrl: string | null;
  isFeatured: boolean;
}

export interface HomeProductSectionConfig {
  id: string;
  titleKey: string;
  subtitleKey?: string;
  viewAllRoute: string | string[];
  viewAllQuery?: Record<string, string>;
  layout: 'grid' | 'scroll';
}

/** Large image tiles — inspired by Lecosma "Curated Edit". */
export interface HomeCuratedCollection {
  id: string;
  eyebrowKey: string;
  titleKey: string;
  hoverCtaKey: string;
  imageUrl: string;
  imageAltKey: string;
  route: string | string[];
  queryParams?: Record<string, string>;
}

export interface HomeOfferCard {
  id: string;
  titleKey: string;
  subtitleKey: string;
  discountLabelKey?: string;
  discountPercent?: number;
  ctaLabelKey: string;
  route: string | string[];
  queryParams?: Record<string, string>;
  theme: 'accent' | 'primary' | 'dark';
}

export interface HomeBrandCard {
  id: string;
  nameKey: string;
  route: string | string[];
  queryParams?: Record<string, string>;
  logoUrl?: string;
  initials: string;
}

export interface HomeTrustBadge {
  id: string;
  labelKey: string;
  descriptionKey: string;
  iconClass: string;
}

export interface HomePageConfig {
  hero: HomeHeroConfig;
  curatedCollections?: {
    sectionEyebrowKey: string;
    sectionTitleKey: string;
    items: HomeCuratedCollection[];
  };
  productSections: HomeProductSectionConfig[];
  offers: HomeOfferCard[];
  brands: {
    titleKey: string;
    subtitleKey: string;
    viewAllRoute: string | string[];
    items: HomeBrandCard[];
  };
  trustBadges: HomeTrustBadge[];
}

export interface HomePageData {
  mostSearched: StorefrontProduct[];
  bestSellers: StorefrontProduct[];
  newArrivals: StorefrontProduct[];
}
