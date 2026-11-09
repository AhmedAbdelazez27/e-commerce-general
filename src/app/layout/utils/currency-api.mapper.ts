import type { PublicCurrencyDto } from '../../core/models/currency.model';
import { isValidCurrencyCode } from '../../core/utils/currency-code.util';

type JsonRecord = Record<string, unknown>;

function readString(o: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readNumber(o: JsonRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function readBool(o: JsonRecord, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return false;
}

export function normalizePublicCurrencyDto(raw: unknown): PublicCurrencyDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const o = raw as JsonRecord;
  const id = readNumber(o, 'id', 'Id');
  const code = readString(o, 'code', 'Code')?.toUpperCase();

  if (id == null || id <= 0 || !code || !isValidCurrencyCode(code)) {
    return null;
  }

  return {
    id,
    code,
    descriptionAr: readString(o, 'descriptionAr', 'DescriptionAr') ?? code,
    descriptionEn: readString(o, 'descriptionEn', 'DescriptionEn') ?? code,
    rate: readNumber(o, 'rate', 'Rate') ?? 1,
    isLocalCurrency: readBool(o, 'isLocalCurrency', 'IsLocalCurrency'),
  };
}
