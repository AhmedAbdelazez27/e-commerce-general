import {
  PortalConfiguration,
  PortalConfigurationDto,
  PortalContactInfo,
  PortalMobileSettings,
  PortalPolicies,
  PortalSeoConfig,
  PortalSocialMedia,
  PortalWorkflowSettings,
} from './portal-configuration.model';

function mergeNested<T extends object>(base: T, patch: Partial<T> | undefined): T {
  if (!patch) {
    return base;
  }
  return { ...base, ...patch };
}

/** Merge remote portal configuration over defaults. */
export function mergePortalConfig(
  base: PortalConfiguration,
  patch: PortalConfigurationDto | null | undefined,
): PortalConfiguration {
  if (!patch) {
    return base;
  }

  const { contactInfo, socialMedia, seo, mobileSettings, workflowSettings, policies, ...rest } = patch;

  return {
    ...base,
    ...rest,
    contactInfo: mergeNested<PortalContactInfo>(base.contactInfo, contactInfo),
    socialMedia: mergeNested<PortalSocialMedia>(base.socialMedia, socialMedia),
    seo: mergeNested<PortalSeoConfig>(base.seo, seo),
    mobileSettings: mergeNested<PortalMobileSettings>(base.mobileSettings, mobileSettings),
    workflowSettings: mergeNested<PortalWorkflowSettings>(base.workflowSettings, workflowSettings),
    policies: mergeNested<PortalPolicies>(base.policies, policies),
  };
}
