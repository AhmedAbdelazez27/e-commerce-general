import { PublicProductImageDto } from '../models/catalog-public-product.model';
import { ProductDetailImage } from '../models/product-detail.model';
import {
  isStorefront3DAssetUrl,
  normalizeStorefrontMediaType,
  resolveProductPosterUrl,
} from '../../../shared/utils/storefront-media.util';

type JsonRecord = Record<string, unknown>;

export interface ProductListingMediaInput {
  mainImageUrl?: string | null;
  mainMediaType?: string | null;
  hasModel3D?: boolean | null;
  images?: Array<{
    imageUrl?: string | null;
    mediaType?: string | null;
    mediaUrl?: string | null;
    iosMediaUrl?: string | null;
    videoUrl?: string | null;
  }> | null;
}

function readStringField(o: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readNumberField(o: JsonRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function readBoolField(o: JsonRecord, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return undefined;
}

export function normalizePublicProductImageDto(raw: unknown): PublicProductImageDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const o = raw as JsonRecord;
  const id = readNumberField(o, 'id', 'Id');
  if (id == null) {
    return null;
  }

  return {
    id,
    productId: readNumberField(o, 'productId', 'ProductId'),
    productVariantId: readNumberField(o, 'productVariantId', 'ProductVariantId') ?? null,
    imageUrl: readStringField(o, 'imageUrl', 'ImageUrl'),
    altText: readStringField(o, 'altText', 'AltText'),
    sortOrder: readNumberField(o, 'sortOrder', 'SortOrder'),
    isPrimary: readBoolField(o, 'isPrimary', 'IsPrimary'),
    isMain: readBoolField(o, 'isMain', 'IsMain'),
    mediaTypeLkpId: readNumberField(o, 'mediaTypeLkpId', 'MediaTypeLkpId') ?? null,
    mediaType: readStringField(o, 'mediaType', 'MediaType'),
    videoUrl: readStringField(o, 'videoUrl', 'VideoUrl'),
    mediaUrl: readStringField(o, 'mediaUrl', 'MediaUrl', 'mediaPath', 'MediaPath'),
    iosMediaUrl: readStringField(o, 'iosMediaUrl', 'IosMediaUrl', 'iosMediaPath', 'IosMediaPath'),
  };
}

export function normalizePublicProductImageList(raw: unknown): PublicProductImageDto[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizePublicProductImageDto(item))
    .filter((item): item is PublicProductImageDto => item != null);
}

export function resolveProductListingMedia(
  input: ProductListingMediaInput,
): { posterUrl?: string; has3D: boolean } {
  const images = input.images ?? [];
  const has3D =
    input.hasModel3D === true ||
    normalizeStorefrontMediaType(input.mainMediaType) === 'Model3D' ||
    isStorefront3DAssetUrl(input.mainImageUrl) ||
    images.some(
      (image) =>
        normalizeStorefrontMediaType(image.mediaType) === 'Model3D' ||
        isStorefront3DAssetUrl(image.mediaUrl) ||
        isStorefront3DAssetUrl(image.iosMediaUrl) ||
        isStorefront3DAssetUrl(image.videoUrl) ||
        isStorefront3DAssetUrl(image.imageUrl),
    );

  const photo = images.find(
    (image) =>
      normalizeStorefrontMediaType(image.mediaType) === 'Image' &&
      !!resolveProductPosterUrl(image.imageUrl),
  );
  const anyPoster = images.find((image) => !!resolveProductPosterUrl(image.imageUrl));

  const posterUrl =
    resolveProductPosterUrl(photo?.imageUrl) ??
    resolveProductPosterUrl(anyPoster?.imageUrl) ??
    resolveProductPosterUrl(input.mainImageUrl);

  return { posterUrl, has3D };
}

export function pickProductDetailPosterUrl(images: ProductDetailImage[]): string | undefined {
  const photo = images.find(
    (image) =>
      (image.mediaType ?? 'Image') === 'Image' && !!resolveProductPosterUrl(image.url),
  );
  const anyPoster = images.find((image) => !!resolveProductPosterUrl(image.url));
  return resolveProductPosterUrl(photo?.url) ?? resolveProductPosterUrl(anyPoster?.url);
}

export function productDetailHas3D(images: ProductDetailImage[]): boolean {
  return images.some(
    (image) =>
      image.mediaType === 'Model3D' ||
      isStorefront3DAssetUrl(image.mediaUrl) ||
      isStorefront3DAssetUrl(image.url),
  );
}
