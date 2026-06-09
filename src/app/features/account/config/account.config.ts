import type { CustomerProfileDto } from '../models/customer-profile.model';

/** Gender lookup ids — adjust if backend lookup values differ. */
export const ACCOUNT_CONFIG = {
  genderOptions: [
    { id: 1, matchValues: ['male', 'm', 'ذكر'], labelKey: 'AUTH.GENDER_MALE' },
    { id: 2, matchValues: ['female', 'f', 'أنثى', 'انثى'], labelKey: 'AUTH.GENDER_FEMALE' },
  ],
} as const;

function parseGenderLkpId(profile: Pick<CustomerProfileDto, 'gender' | 'genderLkpId'>): number | null {
  if (profile.genderLkpId != null && profile.genderLkpId > 0) {
    return profile.genderLkpId;
  }

  const gender = profile.gender?.trim();
  if (!gender || !/^\d+$/.test(gender)) {
    return null;
  }

  const id = Number(gender);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function resolveGenderLabelKey(
  profile: Pick<CustomerProfileDto, 'gender' | 'genderLkpId'>,
): string | null {
  const lkpId = parseGenderLkpId(profile);
  if (lkpId != null) {
    const byId = ACCOUNT_CONFIG.genderOptions.find((option) => option.id === lkpId);
    return byId?.labelKey ?? null;
  }

  const gender = profile.gender?.trim().toLowerCase();
  if (!gender) {
    return null;
  }

  const byValue = ACCOUNT_CONFIG.genderOptions.find((option) =>
    option.matchValues.some((value) => gender === value.toLowerCase() || gender.includes(value.toLowerCase())),
  );
  return byValue?.labelKey ?? null;
}

export function resolveGenderLkpId(profile: Pick<CustomerProfileDto, 'gender' | 'genderLkpId'>): number {
  return parseGenderLkpId(profile) ?? 0;
}
