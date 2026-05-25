export interface AnnouncementMessage {
  id: string;
  /** Short uppercase label shown before the message (Lecosma-style). */
  labelKey?: string;
  translationKey: string;
  translationParams?: Record<string, string | number>;
  linkLabelKey?: string;
  linkRoute?: string | string[];
  linkQueryParams?: Record<string, string>;
}

export interface LayoutLink {
  id: string;
  labelKey: string;
  route: string | string[];
  queryParams?: Record<string, string>;
  external?: boolean;
}

export interface SocialLink {
  id: string;
  labelKey: string;
  href: string;
  iconClass: string;
}

export interface StoreLayoutConfig {
  branding: {
    logoSrc: string;
    logoAltKey: string;
    homeRoute: string;
  };
  announcement: {
    enabled: boolean;
    rotateIntervalMs: number;
    messages: AnnouncementMessage[];
  };
  header: {
    searchPlaceholderKey: string;
    shopRoute: string;
    wishlistRoute: string;
    cartRoute: string;
    loginRoute: string;
    accountRoute: string;
  };
  footer: {
    companyLinks: LayoutLink[];
    customerServiceLinks: LayoutLink[];
    socialLinks: SocialLink[];
    trustItems: { id: string; labelKey: string; iconClass: string }[];
    newsletter: {
      enabled: boolean;
      titleKey: string;
      subtitleKey: string;
      placeholderKey: string;
      buttonKey: string;
    };
  };
}

export interface NavMegaLink {
  id: string;
  labelKey: string;
  route: string | string[];
  queryParams?: Record<string, string>;
}

export interface NavMegaColumn {
  id: string;
  titleKey: string;
  links: NavMegaLink[];
}

export interface NavCategory {
  id: string;
  labelKey: string;
  route: string | string[];
  queryParams?: Record<string, string>;
  megaMenu?: NavMegaColumn[];
  /** Top-level only — shown in mobile drawer without mega panel */
  mobileOnly?: boolean;
}
