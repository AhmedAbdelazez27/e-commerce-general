import type { CustomerGroupDto, CustomerProfileDto } from '../models/customer-profile.model';

type JsonRecord = Record<string, unknown>;

export function normalizeCustomerProfile(raw: unknown): CustomerProfileDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const o = raw as JsonRecord;
  const id = readNumber(o, 'id', 'Id');
  if (id == null || id <= 0) {
    return null;
  }

  return {
    id,
    abpUserId: readNumber(o, 'abpUserId', 'AbpUserId') ?? 0,
    customerCode: readString(o, 'customerCode', 'CustomerCode') ?? '',
    customerGroupId: readNumber(o, 'customerGroupId', 'CustomerGroupId') ?? 0,
    fullName: readString(o, 'fullName', 'FullName') ?? '',
    email: readString(o, 'email', 'Email') ?? '',
    mobile: readString(o, 'mobile', 'Mobile') ?? '',
    birthDate: readString(o, 'birthDate', 'BirthDate') ?? null,
    ...normalizeGenderFields(o),
    defaultAddressId: readNumber(o, 'defaultAddressId', 'DefaultAddressId') ?? null,
    loyaltyPoints: readNumber(o, 'loyaltyPoints', 'LoyaltyPoints') ?? 0,
    totalSpent: readNumber(o, 'totalSpent', 'TotalSpent') ?? 0,
    isVIP: readBool(o, 'isVIP', 'IsVIP') ?? false,
    customerGroup: normalizeCustomerGroup(o['customerGroup'] ?? o['CustomerGroup']),
  };
}

function normalizeGenderFields(o: JsonRecord): Pick<CustomerProfileDto, 'gender' | 'genderLkpId'> {
  const genderLkpId = readNumber(o, 'genderLkpId', 'GenderLkpId');
  const genderRaw = readString(o, 'gender', 'Gender') ?? stringifyNumber(o['gender'] ?? o['Gender']);

  if (genderLkpId != null && genderLkpId > 0) {
    return {
      genderLkpId,
      gender: genderRaw && !isNumericGender(genderRaw) ? genderRaw : null,
    };
  }

  if (genderRaw && isNumericGender(genderRaw)) {
    const id = Number(genderRaw);
    return {
      genderLkpId: id > 0 ? id : null,
      gender: null,
    };
  }

  return {
    genderLkpId: null,
    gender: genderRaw ?? null,
  };
}

function isNumericGender(value: string): boolean {
  return /^\d+$/.test(value.trim());
}

function stringifyNumber(value: unknown): string | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : undefined;
}

function normalizeCustomerGroup(raw: unknown): CustomerGroupDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const o = raw as JsonRecord;
  const id = readNumber(o, 'id', 'Id');
  if (id == null || id <= 0) {
    return null;
  }

  return {
    id,
    code: readString(o, 'code', 'Code') ?? '',
    nameAr: readString(o, 'nameAr', 'NameAr') ?? '',
    nameEn: readString(o, 'nameEn', 'NameEn') ?? '',
    priceListId: readNumber(o, 'priceListId', 'PriceListId') ?? 0,
    isDefault: readBool(o, 'isDefault', 'IsDefault') ?? false,
    isActive: readBool(o, 'isActive', 'IsActive') ?? false,
  };
}

function readNumber(o: JsonRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === 'number' && Number.isFinite(v)) {
      return v;
    }
  }
  return undefined;
}

function readString(o: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === 'string') {
      return v;
    }
  }
  return undefined;
}

function readBool(o: JsonRecord, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === 'boolean') {
      return v;
    }
  }
  return undefined;
}
