import type { EcWishlistDto, EcWishlistItem } from '../models/ec-wishlist.model';
import { resolveAttachmentUrlOptional } from '../../../core/utils/attachment-url.util';

type JsonRecord = Record<string, unknown>;

/** Normalizes EcWishlist / ABP wishlist payloads (camelCase or PascalCase) into `EcWishlistDto`. */
export function normalizeWishlistDto(raw: unknown): EcWishlistDto {
  if (raw == null) {
    return { Items: [] };
  }

  if (Array.isArray(raw)) {
    return { Items: normalizeWishlistItems(raw) };
  }

  if (typeof raw !== 'object') {
    return { Items: [] };
  }

  const o = raw as JsonRecord;
  const itemsRaw = o['Items'] ?? o['items'];
  const items = Array.isArray(itemsRaw) ? normalizeWishlistItems(itemsRaw) : [];

  return {
    CurrencyId: readNumber(o, 'CurrencyId', 'currencyId'),
    CurrencyCode: readString(o, 'CurrencyCode', 'currencyCode'),
    CurrencyNameAr: readString(o, 'CurrencyNameAr', 'currencyNameAr'),
    CurrencyNameEn: readString(o, 'CurrencyNameEn', 'currencyNameEn'),
    CurrencyRate: readNumber(o, 'CurrencyRate', 'currencyRate'),
    LocalCurrencyId: readNumber(o, 'LocalCurrencyId', 'localCurrencyId'),
    LocalCurrencyCode: readString(o, 'LocalCurrencyCode', 'localCurrencyCode'),
    Items: items,
  };
}

export function normalizeWishlistItems(raw: unknown): EcWishlistItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map(normalizeWishlistItem)
    .filter((item): item is EcWishlistItem => item != null);
}

function normalizeWishlistItem(raw: unknown): EcWishlistItem | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const o = raw as JsonRecord;
  const price = normalizeWishlistItemPrice(o['price'] ?? o['Price']);

  const productVariantId =
    readNumber(o, 'productVariantId', 'ProductVariantId') ?? price?.productVariantId ?? 0;
  if (productVariantId <= 0) {
    return null;
  }

  const id =
    readNumber(o, 'productId', 'ProductId') ??
    readNumber(o, 'id', 'Id') ??
    productVariantId;

  const nameEn =
    readString(o, 'nameEn', 'NameEn', 'productNameEn', 'ProductNameEn', 'productName', 'ProductName') ??
    readString(o, 'title', 'Title') ??
    '';
  const nameAr =
    readString(o, 'nameAr', 'NameAr', 'productNameAr', 'ProductNameAr') ??
    readString(o, 'titleAr', 'TitleAr') ??
    nameEn;

  const priceValue =
    readNumber(o, 'finalPrice', 'FinalPrice') ??
    price?.finalPrice ??
    readNumber(o, 'price', 'Price', 'unitPrice', 'UnitPrice') ??
    0;
  const compareAtPrice = readNumber(o, 'compareAtPrice', 'CompareAtPrice', 'oldPrice', 'OldPrice');

  const imageUrl = resolveAttachmentUrlOptional(
    readString(
      o,
      'imageUrl',
      'ImageUrl',
      'productImageUrl',
      'ProductImageUrl',
      'productVariantImageUrl',
      'ProductVariantImageUrl',
      'image',
      'Image',
      'thumbnailUrl',
      'ThumbnailUrl',
    ),
  );

  const slug = readString(o, 'slug', 'Slug') ?? undefined;
  const brandName = readString(o, 'brandName', 'BrandName') ?? undefined;
  const rating = readNumber(o, 'rating', 'Rating') ?? undefined;
  const reviewCount = readNumber(o, 'reviewCount', 'ReviewCount') ?? undefined;
  const discountPercent = readNumber(o, 'discountPercent', 'DiscountPercent') ?? undefined;

  const isAvailable = readBool(o, 'isAvailable', 'IsAvailable');
  const isNew = readBool(o, 'isNew', 'IsNew');
  const isBestSeller = readBool(o, 'isBestSeller', 'IsBestSeller');

  const currencyCode =
    readString(o, 'currencyCode', 'CurrencyCode') ?? price?.currencyCode ?? undefined;

  return {
    id,
    productVariantId,
    slug,
    nameEn: nameEn || String(id),
    nameAr: nameAr || nameEn || String(id),
    price: priceValue,
    compareAtPrice: compareAtPrice ?? undefined,
    imageUrl,
    brandName,
    rating,
    reviewCount,
    discountPercent: discountPercent ?? undefined,
    isAvailable: isAvailable ?? undefined,
    isNew: isNew ?? undefined,
    isBestSeller: isBestSeller ?? undefined,
    currencyCode,
  };
}

function normalizeWishlistItemPrice(raw: unknown): {
  productVariantId?: number;
  finalPrice?: number;
  currencyCode?: string;
} | undefined {
  if (raw == null || typeof raw !== 'object') {
    return undefined;
  }

  const o = raw as JsonRecord;
  return {
    productVariantId: readNumber(o, 'productVariantId', 'ProductVariantId'),
    finalPrice: readNumber(o, 'finalPrice', 'FinalPrice'),
    currencyCode: readString(o, 'currencyCode', 'CurrencyCode'),
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
    if (typeof v === 'string' && v.trim()) {
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
