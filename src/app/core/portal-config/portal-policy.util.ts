import { AppLang } from '../services/language.service';
import {
  PortalPolicies,
  PortalPolicyType,
} from './portal-configuration.model';

const POLICY_FIELD_KEYS: Record<
  PortalPolicyType,
  { ar: keyof PortalPolicies; en: keyof PortalPolicies }
> = {
  terms: { ar: 'termsAndConditionsAr', en: 'termsAndConditionsEn' },
  privacy: { ar: 'privacyPolicyAr', en: 'privacyPolicyEn' },
  refund: { ar: 'refundPolicyAr', en: 'refundPolicyEn' },
};

export function resolvePortalPolicyText(
  policies: PortalPolicies,
  type: PortalPolicyType,
  lang: AppLang,
): string {
  const keys = POLICY_FIELD_KEYS[type];
  const value = lang === 'ar' ? policies[keys.ar] : policies[keys.en];
  return value?.trim() ?? '';
}

export function portalPolicyHasContent(
  policies: PortalPolicies,
  type: PortalPolicyType,
): boolean {
  const keys = POLICY_FIELD_KEYS[type];
  return Boolean(policies[keys.ar]?.trim() || policies[keys.en]?.trim());
}

export function portalPoliciesAvailable(policies: PortalPolicies): PortalPolicyType[] {
  const types: PortalPolicyType[] = ['terms', 'privacy', 'refund'];
  return types.filter((type) => portalPolicyHasContent(policies, type));
}

export function isPortalPolicyType(value: string | null | undefined): value is PortalPolicyType {
  return value === 'terms' || value === 'privacy' || value === 'refund';
}
