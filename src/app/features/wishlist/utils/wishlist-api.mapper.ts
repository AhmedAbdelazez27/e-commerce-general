import type { EcWishlistItem } from '../models/ec-wishlist.model';

type JsonRecord = Record<string, unknown>;

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

  const productVariantId = readNumber(o, 'productVariantId', 'ProductVariantId') ?? 0;
  if (productVariantId <= 0) {
    return null;
  }

  // Many backends return either productId or variantId as "id".
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

  const price =
    readNumber(o, 'price', 'Price', 'finalPrice', 'FinalPrice', 'unitPrice', 'UnitPrice') ?? 0;
  const compareAtPrice = readNumber(o, 'compareAtPrice', 'CompareAtPrice', 'oldPrice', 'OldPrice');

  const imageUrl =
    readString(o, 'imageUrl', 'ImageUrl', 'image', 'Image', 'thumbnailUrl', 'ThumbnailUrl') ??
    undefined;

  const slug = readString(o, 'slug', 'Slug') ?? undefined;
  const brandName = readString(o, 'brandName', 'BrandName') ?? undefined;
  const rating = readNumber(o, 'rating', 'Rating') ?? undefined;
  const reviewCount = readNumber(o, 'reviewCount', 'ReviewCount') ?? undefined;
  const discountPercent = readNumber(o, 'discountPercent', 'DiscountPercent') ?? undefined;

  const isAvailable = readBool(o, 'isAvailable', 'IsAvailable');
  const isNew = readBool(o, 'isNew', 'IsNew');
  const isBestSeller = readBool(o, 'isBestSeller', 'IsBestSeller');

  return {
    id,
    productVariantId,
    slug,
    nameEn: nameEn || String(id),
    nameAr: nameAr || nameEn || String(id),
    price,
    compareAtPrice: compareAtPrice ?? undefined,
    imageUrl,
    brandName,
    rating,
    reviewCount,
    discountPercent: discountPercent ?? undefined,
    isAvailable: isAvailable ?? undefined,
    isNew: isNew ?? undefined,
    isBestSeller: isBestSeller ?? undefined,
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

