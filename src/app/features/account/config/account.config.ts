import type { CustomerProfileDto } from '../models/customer-profile.model';

export const GENDER_OPTIONS = [
  { value: 'Male', labelKey: 'AUTH.GENDER_MALE', matchValues: ['male', 'm', 'ذكر'] },
  { value: 'Female', labelKey: 'AUTH.GENDER_FEMALE', matchValues: ['female', 'f', 'أنثى', 'انثى'] },
  {
    value: 'Unspecified',
    labelKey: 'AUTH.GENDER_UNSPECIFIED',
    matchValues: ['unspecified', 'غير محدد', 'غيرمحدد'],
  },
] as const;

export type GenderValue = (typeof GENDER_OPTIONS)[number]['value'];

/** @deprecated Use GENDER_OPTIONS */
export const ACCOUNT_CONFIG = {
  genderOptions: GENDER_OPTIONS,
} as const;

function findGenderOption(raw: string | null | undefined) {
  const gender = raw?.trim();
  if (!gender) {
    return null;
  }

  const normalized = gender.toLowerCase();
  return (
    GENDER_OPTIONS.find((option) => option.value.toLowerCase() === normalized) ??
    GENDER_OPTIONS.find((option) =>
      option.matchValues.some(
        (value) => normalized === value.toLowerCase() || normalized.includes(value.toLowerCase()),
      ),
    ) ??
    null
  );
}

function genderFromLkpId(genderLkpId: number | null | undefined): GenderValue | null {
  if (genderLkpId === 1) {
    return 'Male';
  }
  if (genderLkpId === 2) {
    return 'Female';
  }
  if (genderLkpId === 3) {
    return 'Unspecified';
  }
  return null;
}

export function resolveGenderLabelKey(
  profile: Pick<CustomerProfileDto, 'gender' | 'genderLkpId'>,
): string | null {
  const fromGender = findGenderOption(profile.gender);
  if (fromGender) {
    return fromGender.labelKey;
  }

  const fromLkpId = genderFromLkpId(profile.genderLkpId);
  if (fromLkpId) {
    return GENDER_OPTIONS.find((option) => option.value === fromLkpId)?.labelKey ?? null;
  }

  return null;
}

export function resolveGenderFormValue(
  profile: Pick<CustomerProfileDto, 'gender' | 'genderLkpId'>,
): string {
  const fromGender = findGenderOption(profile.gender);
  if (fromGender) {
    return fromGender.value;
  }

  return genderFromLkpId(profile.genderLkpId) ?? '';
}
