import { SocialLink } from '../../layout/models/layout.model';
import {
  pickPortalAttachmentBaseUrl,
  resolveAttachmentUrlOptional,
} from '../utils/attachment-url.util';
import {
  PortalConfigurationDto,
  PortalPolicies,
  PortalSocialMedia,
} from './portal-configuration.model';

const SWAGGER_PLACEHOLDER = 'string';

/** Ignore empty or Swagger placeholder values from the API. */
export function pickPortalString(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === SWAGGER_PLACEHOLDER) {
    return undefined;
  }
  return trimmed;
}

export function pickPortalNumber(value: number | undefined | null): number | undefined {
  if (value == null || Number.isNaN(value) || value <= 0) {
    return undefined;
  }
  return value;
}

/** Normalize API DTO before merging with defaults. */
export function normalizePortalConfigurationDto(
  dto: PortalConfigurationDto,
): PortalConfigurationDto {
  const portalBaseUrl = pickPortalAttachmentBaseUrl(dto.portalBaseUrl);

  return {
    ...dto,
    portalNameAr: pickPortalString(dto.portalNameAr),
    portalNameEn: pickPortalString(dto.portalNameEn),
    portalDescriptionAr: pickPortalString(dto.portalDescriptionAr),
    portalDescriptionEn: pickPortalString(dto.portalDescriptionEn),
    portalBaseUrl,
    logoUrl: resolveAttachmentUrlOptional(dto.logoUrl, portalBaseUrl),
    darkLogoUrl: resolveAttachmentUrlOptional(dto.darkLogoUrl, portalBaseUrl),
    mobileLogoUrl: resolveAttachmentUrlOptional(dto.mobileLogoUrl, portalBaseUrl),
    faviconUrl: resolveAttachmentUrlOptional(dto.faviconUrl, portalBaseUrl),
    splashScreenImageUrl: resolveAttachmentUrlOptional(dto.splashScreenImageUrl, portalBaseUrl),
    primaryColor: pickPortalString(dto.primaryColor),
    secondaryColor: pickPortalString(dto.secondaryColor),
    accentColor: pickPortalString(dto.accentColor),
    backgroundColor: pickPortalString(dto.backgroundColor),
    sectionBackgroundColor: pickPortalString(dto.sectionBackgroundColor),
    mainBackgroundColor: pickPortalString(dto.mainBackgroundColor),
    textColor: pickPortalString(dto.textColor),
    headerColor: pickPortalString(dto.headerColor),
    footerColor: pickPortalString(dto.footerColor),
    fontFamilyAr: pickPortalString(dto.fontFamilyAr),
    fontFamilyEn: pickPortalString(dto.fontFamilyEn),
    fontSizeBase: pickPortalNumber(dto.fontSizeBase),
    fontSizeHeading: pickPortalNumber(dto.fontSizeHeading),
    fontSizeSmall: pickPortalNumber(dto.fontSizeSmall),
    featuredProductsCount: pickPortalNumber(dto.featuredProductsCount),
    bestSellerCount: pickPortalNumber(dto.bestSellerCount),
    newArrivalCount: pickPortalNumber(dto.newArrivalCount),
    addressAr: pickPortalString(dto.addressAr),
    addressEn: pickPortalString(dto.addressEn),
    contactInfo: dto.contactInfo
      ? {
          email: pickPortalString(dto.contactInfo.email),
          phone: pickPortalString(dto.contactInfo.phone),
          whatsApp: pickPortalString(dto.contactInfo.whatsApp),
          supportEmail: pickPortalString(dto.contactInfo.supportEmail),
          supportPhone: pickPortalString(dto.contactInfo.supportPhone),
          addressAr: pickPortalString(dto.contactInfo.addressAr) ?? pickPortalString(dto.addressAr),
          addressEn: pickPortalString(dto.contactInfo.addressEn) ?? pickPortalString(dto.addressEn),
        }
      : undefined,
    socialMedia: dto.socialMedia ? normalizeSocialMedia(dto.socialMedia) : undefined,
    seo: dto.seo
      ? {
          seoTitleAr: pickPortalString(dto.seo.seoTitleAr),
          seoTitleEn: pickPortalString(dto.seo.seoTitleEn),
          seoDescriptionAr: pickPortalString(dto.seo.seoDescriptionAr),
          seoDescriptionEn: pickPortalString(dto.seo.seoDescriptionEn),
          seoKeywords: pickPortalString(dto.seo.seoKeywords),
        }
      : undefined,
    mobileSettings: dto.mobileSettings ?? undefined,
    workflowSettings: dto.workflowSettings ?? undefined,
    policies: normalizePolicies(dto),
  };
}

function normalizePolicies(dto: PortalConfigurationDto): Partial<PortalPolicies> | undefined {
  const nested = dto.policies;
  const policies: Partial<PortalPolicies> = {
    termsAndConditionsAr:
      pickPortalString(nested?.termsAndConditionsAr) ?? pickPortalString(dto.termsAndConditionsAr),
    termsAndConditionsEn:
      pickPortalString(nested?.termsAndConditionsEn) ?? pickPortalString(dto.termsAndConditionsEn),
    privacyPolicyAr:
      pickPortalString(nested?.privacyPolicyAr) ?? pickPortalString(dto.privacyPolicyAr),
    privacyPolicyEn:
      pickPortalString(nested?.privacyPolicyEn) ?? pickPortalString(dto.privacyPolicyEn),
    refundPolicyAr:
      pickPortalString(nested?.refundPolicyAr) ?? pickPortalString(dto.refundPolicyAr),
    refundPolicyEn:
      pickPortalString(nested?.refundPolicyEn) ?? pickPortalString(dto.refundPolicyEn),
  };

  const hasAny = Object.values(policies).some((value) => value?.trim());
  return hasAny ? policies : undefined;
}

function normalizeSocialMedia(social: Partial<PortalSocialMedia>): Partial<PortalSocialMedia> {
  return {
    facebookUrl: pickPortalString(social.facebookUrl),
    instagramUrl: pickPortalString(social.instagramUrl),
    twitterUrl: pickPortalString(social.twitterUrl),
    tikTokUrl: pickPortalString(social.tikTokUrl),
    linkedInUrl: pickPortalString(social.linkedInUrl),
    youTubeUrl: pickPortalString(social.youTubeUrl),
    snapchatUrl: pickPortalString(social.snapchatUrl),
  };
}

const SOCIAL_NETWORKS: {
  id: string;
  key: keyof PortalSocialMedia;
  labelKey: string;
  iconClass: string;
}[] = [
  { id: 'instagram', key: 'instagramUrl', labelKey: 'LAYOUT.FOOTER.SOCIAL_INSTAGRAM', iconClass: 'fa-brands fa-instagram' },
  { id: 'facebook', key: 'facebookUrl', labelKey: 'LAYOUT.FOOTER.SOCIAL_FACEBOOK', iconClass: 'fa-brands fa-facebook-f' },
  { id: 'tiktok', key: 'tikTokUrl', labelKey: 'LAYOUT.FOOTER.SOCIAL_TIKTOK', iconClass: 'fa-brands fa-tiktok' },
  { id: 'twitter', key: 'twitterUrl', labelKey: 'LAYOUT.FOOTER.SOCIAL_TWITTER', iconClass: 'fa-brands fa-x-twitter' },
  { id: 'linkedin', key: 'linkedInUrl', labelKey: 'LAYOUT.FOOTER.SOCIAL_LINKEDIN', iconClass: 'fa-brands fa-linkedin-in' },
  { id: 'youtube', key: 'youTubeUrl', labelKey: 'LAYOUT.FOOTER.SOCIAL_YOUTUBE', iconClass: 'fa-brands fa-youtube' },
  { id: 'snapchat', key: 'snapchatUrl', labelKey: 'LAYOUT.FOOTER.SOCIAL_SNAPCHAT', iconClass: 'fa-brands fa-snapchat' },
];

/** Build footer social links from API URLs, falling back to static layout links. */
export function resolvePortalSocialLinks(
  social: PortalSocialMedia,
  fallback: SocialLink[],
): SocialLink[] {
  const fromApi: SocialLink[] = [];

  for (const network of SOCIAL_NETWORKS) {
    const href = pickPortalString(social[network.key]);
    if (href) {
      fromApi.push({
        id: network.id,
        labelKey: network.labelKey,
        href,
        iconClass: network.iconClass,
      });
    }
  }

  return fromApi.length > 0 ? fromApi : fallback;
}
