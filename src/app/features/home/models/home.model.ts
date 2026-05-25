import { StorefrontProduct } from '../../../shared/models/storefront-product.model';

export interface HomeHeroConfig {
  imageSrc: string;
  imageAltKey: string;
  eyebrowKey?: string;
  headlineKey: string;
  subtitleKey: string;
  ctaLabelKey: string;
  ctaRoute: string;
  ctaQuery?: Record<string, string>;
  secondaryCtaLabelKey?: string;
  secondaryCtaRoute?: string;
  secondaryCtaQuery?: Record<string, string>;
  promoCard: {
    enabled: boolean;
    eyebrowKey: string;
    titleKey: string;
    subtitleKey: string;
    ctaLabelKey: string;
    ctaRoute: string;
    ctaQuery?: Record<string, string>;
    accentClass?: string;
  };
}

export interface HomeCategoryShortcut {
  id: string;
  labelKey: string;
  route: string | string[];
  queryParams?: Record<string, string>;
  iconClass: string;
  productCount?: number;
  imageUrl?: string;
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
  categoryShortcuts: HomeCategoryShortcut[];
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
