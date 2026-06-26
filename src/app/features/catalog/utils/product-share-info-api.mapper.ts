import type {
  PublicProductShareDto,
  PublicProductShareInfoDto,
} from '../models/product-share-info.model';

type JsonRecord = Record<string, unknown>;

function readNumber(o: JsonRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
}

function readString(o: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function normalizeShare(raw: unknown): PublicProductShareDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const o = raw as JsonRecord;
  const url = readString(o, 'url', 'Url');
  if (!url) {
    return null;
  }

  return {
    url,
    titleAr: readString(o, 'titleAr', 'TitleAr') ?? '',
    titleEn: readString(o, 'titleEn', 'TitleEn') ?? '',
    descriptionAr: readString(o, 'descriptionAr', 'DescriptionAr') ?? '',
    descriptionEn: readString(o, 'descriptionEn', 'DescriptionEn') ?? '',
    imageUrl: readString(o, 'imageUrl', 'ImageUrl'),
  };
}

export function normalizeProductShareInfoDto(raw: unknown): PublicProductShareInfoDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const o = raw as JsonRecord;
  const productId = readNumber(o, 'productId', 'ProductId');
  const shareRaw = o['share'] ?? o['Share'];
  const share = normalizeShare(shareRaw);

  if (productId == null || productId < 1 || !share) {
    return null;
  }

  return {
    productId,
    slug: readString(o, 'slug', 'Slug'),
    share,
  };
}
