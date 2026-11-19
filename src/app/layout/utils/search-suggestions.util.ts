export const SEARCH_SUGGESTION_MIN_LENGTH = 2;
export const SEARCH_SUGGESTION_LIMIT = 10;
export const SEARCH_SUGGESTION_DEBOUNCE_MS = 300;

type JsonRecord = Record<string, unknown>;

export function moveSuggestionIndex(current: number, delta: 1 | -1, count: number): number {
  if (count <= 0) {
    return -1;
  }
  if (current < 0) {
    return delta > 0 ? 0 : count - 1;
  }
  const next = current + delta;
  if (next < 0) {
    return 0;
  }
  if (next >= count) {
    return count - 1;
  }
  return next;
}

/** Reads up to 10 display names from an ABP envelope, `{ items }`, or a raw array. */
export function readSearchSuggestionNames(res: unknown, lang: 'ar' | 'en'): string[] {
  const names: string[] = [];
  for (const item of extractSuggestionItems(res)) {
    const label = suggestionLabel(item, lang);
    if (!label || names.includes(label)) {
      continue;
    }
    names.push(label);
    if (names.length === SEARCH_SUGGESTION_LIMIT) {
      break;
    }
  }
  return names;
}

function extractSuggestionItems(res: unknown): unknown[] {
  if (Array.isArray(res)) {
    return res;
  }
  if (res == null || typeof res !== 'object') {
    return [];
  }
  const record = res as JsonRecord;
  const payload = record['result'] ?? record['Result'] ?? record['data'] ?? record['Data'] ?? res;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload != null && typeof payload === 'object') {
    const items = (payload as JsonRecord)['items'] ?? (payload as JsonRecord)['Items'];
    if (Array.isArray(items)) {
      return items;
    }
  }
  return [];
}

function suggestionLabel(item: unknown, lang: 'ar' | 'en'): string {
  if (typeof item === 'string') {
    return item.trim();
  }
  if (item == null || typeof item !== 'object') {
    return '';
  }
  const row = item as JsonRecord;
  const name = readString(row, 'name', 'Name');
  const nameAr = readString(row, 'nameAr', 'NameAr');
  const nameEn = readString(row, 'nameEn', 'NameEn');
  if (lang === 'ar') {
    return nameAr || name || nameEn;
  }
  return nameEn || name || nameAr;
}

function readString(row: JsonRecord, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}
