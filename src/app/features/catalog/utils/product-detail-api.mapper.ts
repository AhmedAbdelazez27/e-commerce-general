import {
  canPurchase,
  modelId,
  normalizeStock,
  requiresModel,
} from '../../../shared/utils/product-stock.util';
import { AppLang } from '../../../core/services/language.service';
import { resolveAttachmentUrlOptional } from '../../../core/utils/attachment-url.util';
import { CatalogListingProduct } from '../models/catalog-listing.model';
import {
  PublicFinalPriceDto,
  PublicProductDetailsDto,
  PublicProductImageDto,
  PublicProductSpecificationDto,
  PublicProductVariantDto,
  PublicRelatedProductDto,
} from '../models/catalog-public-product.model';
import {
  ProductDetail,
  ProductDetailImage,
  ProductDetailSpec,
  ProductDetailVariant,
  ProductDetailVariantContext,
} from '../models/product-detail.model';
import {
  isStorefront3DAssetUrl,
  normalizeStorefrontMediaType,
  resolveModel3dViewerSources,
  resolveProductPosterUrl,
  resolveStorefrontMediaUrl,
} from '../../../shared/utils/storefront-media.util';
import { normalizePublicProductImageDto, resolveProductListingMedia } from './catalog-media.util';
import { normalizeSearchProductPrice } from './catalog-listing-api.mapper';
import { normalizeOfferBadges } from '../../../shared/utils/promotion-api.mapper';

type JsonRecord = Record<string, unknown>;

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

function pickDescription(...values: (string | null | undefined)[]): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
}

/** Normalizes ABP GetProductDetails payload (camelCase or PascalCase). */
export function normalizePublicProductDetailsDto(raw: unknown): PublicProductDetailsDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const o = raw as JsonRecord;
  const id = readNumberField(o, 'id', 'Id');
  if (id == null) {
    return null;
  }

  const base = raw as PublicProductDetailsDto;
  const variantsRaw = o['variants'] ?? o['Variants'];
  const price = normalizeSearchProductPrice(o['price'] ?? o['Price']) ?? base.price;

  return {
    ...base,
    stock: normalizeStock(o['stock'] ?? o['Stock']),
    id,
    productId: readNumberField(o, 'productId', 'ProductId') ?? base.productId ?? id,
    slug: readStringField(o, 'slug', 'Slug') ?? base.slug ?? null,
    sku: readStringField(o, 'sku', 'Sku', 'SKU') ?? base.sku,
    name: readStringField(o, 'name', 'Name') ?? base.name,
    nameAr: readStringField(o, 'nameAr', 'NameAr') ?? base.nameAr,
    nameEn: readStringField(o, 'nameEn', 'NameEn') ?? base.nameEn,
    shortDescription:
      readStringField(o, 'shortDescription', 'ShortDescription') ?? base.shortDescription ?? null,
    shortDescriptionAr:
      readStringField(o, 'shortDescriptionAr', 'ShortDescriptionAr') ??
      base.shortDescriptionAr ??
      null,
    shortDescriptionEn:
      readStringField(o, 'shortDescriptionEn', 'ShortDescriptionEn') ??
      base.shortDescriptionEn ??
      null,
    description: readStringField(o, 'description', 'Description') ?? base.description ?? null,
    descriptionAr:
      readStringField(o, 'descriptionAr', 'DescriptionAr') ?? base.descriptionAr ?? null,
    descriptionEn:
      readStringField(o, 'descriptionEn', 'DescriptionEn') ?? base.descriptionEn ?? null,
    metaTitle: readStringField(o, 'metaTitle', 'MetaTitle') ?? base.metaTitle ?? null,
    metaKeywords: readStringField(o, 'metaKeywords', 'MetaKeywords') ?? base.metaKeywords ?? null,
    metaDescription:
      readStringField(o, 'metaDescription', 'MetaDescription') ?? base.metaDescription ?? null,
    mainImageUrl:
      resolveAttachmentUrlOptional(
        readStringField(o, 'mainImageUrl', 'MainImageUrl') ?? base.mainImageUrl,
      ) ?? null,
    price,
    offers: normalizeOfferBadges(o['offers'] ?? o['Offers']),
    variants: Array.isArray(variantsRaw)
      ? variantsRaw
          .map(normalizePublicProductVariantDto)
          .filter((item): item is PublicProductVariantDto => item != null)
      : base.variants,
  };
}

export function normalizePublicProductVariantDto(raw: unknown): PublicProductVariantDto | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as JsonRecord;
  const id = readNumberField(o, 'id', 'Id');
  const productId = readNumberField(o, 'productId', 'ProductId');
  if (!id || !productId) return null;
  const base = raw as PublicProductVariantDto;
  return {
    ...base,
    stock: normalizeStock(o['stock'] ?? o['Stock']),
    id,
    productId,
    variantSKU: readStringField(o, 'variantSKU', 'variantSku', 'VariantSKU', 'VariantSku'),
    variantName: readStringField(o, 'variantName', 'VariantName'),
    additionalPrice: readNumberField(o, 'additionalPrice', 'AdditionalPrice'),
    quantity: readNumberField(o, 'quantity', 'Quantity'),
    sortOrder: readNumberField(o, 'sortOrder', 'SortOrder'),
    availabilityStatus: readStringField(o, 'availabilityStatus', 'AvailabilityStatus'),
    price: normalizeSearchProductPrice(o['price'] ?? o['Price']) ?? base.price,
    offers: normalizeOfferBadges(o['offers'] ?? o['Offers']),
  };
}

export function normalizePublicFinalPriceDto(raw: unknown): PublicFinalPriceDto | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as JsonRecord;
  const productVariantId = readNumberField(o, 'productVariantId', 'ProductVariantId');
  if (readNumberField(o, 'finalPrice', 'FinalPrice') == null) return null;
  return {
    productVariantId: modelId(productVariantId),
    productId: readNumberField(o, 'productId', 'ProductId'),
    basePrice: readNumberField(o, 'basePrice', 'BasePrice') ?? 0,
    customerPrice: readNumberField(o, 'customerPrice', 'CustomerPrice') ?? 0,
    discountAmount: readNumberField(o, 'discountAmount', 'DiscountAmount') ?? 0,
    couponDiscountAmount: readNumberField(o, 'couponDiscountAmount', 'CouponDiscountAmount') ?? 0,
    taxAmount: readNumberField(o, 'taxAmount', 'TaxAmount') ?? 0,
    finalPrice: readNumberField(o, 'finalPrice', 'FinalPrice') ?? 0,
    appliedDiscountName: readStringField(o, 'appliedDiscountName', 'AppliedDiscountName') ?? null,
    appliedCouponCode: readStringField(o, 'appliedCouponCode', 'AppliedCouponCode') ?? null,
    offers: normalizeOfferBadges(o['offers'] ?? o['Offers']),
  };
}

export function normalizePublicRelatedProductDto(raw: unknown): PublicRelatedProductDto | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as JsonRecord;
  const id = readNumberField(o, 'id', 'Id');
  const productId = readNumberField(o, 'productId', 'ProductId') ?? id;
  if (!id || !productId) return null;
  const base = raw as PublicRelatedProductDto;
  return {
    ...base,
    stock: normalizeStock(o['stock'] ?? o['Stock']),
    id,
    productId,
    name: readStringField(o, 'name', 'Name') ?? base.name,
    nameAr: readStringField(o, 'nameAr', 'NameAr'),
    nameEn: readStringField(o, 'nameEn', 'NameEn'),
    finalPrice: readNumberField(o, 'finalPrice', 'FinalPrice') ?? 0,
    offers: normalizeOfferBadges(o['offers'] ?? o['Offers']),
  };
}

function resolveProductDescriptions(dto: PublicProductDetailsDto): {
  descriptionEn: string;
  descriptionAr: string;
} {
  const descriptionEn = pickDescription(
    dto.descriptionEn,
    dto.description,
    dto.shortDescriptionEn,
    dto.shortDescription,
  );
  const descriptionAr = pickDescription(
    dto.descriptionAr,
    dto.shortDescriptionAr,
    dto.descriptionEn,
    dto.description,
    dto.shortDescriptionEn,
    dto.shortDescription,
  );

  return { descriptionEn, descriptionAr };
}

function resolveDetailsPrice(dto: PublicProductDetailsDto): number {
  if (dto.price?.finalPrice != null && dto.price.finalPrice > 0) {
    return dto.price.finalPrice;
  }
  if (dto.finalPrice != null && dto.finalPrice > 0) {
    return dto.finalPrice;
  }
  return dto.price?.customerPrice ?? dto.price?.basePrice ?? 0;
}

function formatSpecificationValue(spec: PublicProductSpecificationDto): { en: string; ar: string } {
  if (spec.displayValue) {
    return { en: spec.displayValue, ar: spec.displayValue };
  }
  if (spec.textValue) {
    return { en: spec.textValue, ar: spec.textValue };
  }
  if (spec.boolValue != null) {
    return spec.boolValue ? { en: 'Yes', ar: 'نعم' } : { en: 'No', ar: 'لا' };
  }
  if (spec.numericValue != null) {
    const unit = spec.unitSymbol ?? spec.unitName ?? '';
    const value = unit ? `${spec.numericValue} ${unit}` : String(spec.numericValue);
    return { en: value, ar: value };
  }
  return { en: '—', ar: '—' };
}

export function mapProductSpecifications(
  specs: PublicProductSpecificationDto[],
): ProductDetailSpec[] {
  const seen = new Set<number>();
  const result: ProductDetailSpec[] = [];

  for (const spec of specs) {
    if (seen.has(spec.specificationTypeId)) {
      continue;
    }
    seen.add(spec.specificationTypeId);
    const value = formatSpecificationValue(spec);
    result.push({
      labelEn: spec.specificationNameEn || spec.specificationName || spec.code || '',
      labelAr: spec.specificationNameAr || spec.specificationName || spec.code || '',
      valueEn: value.en,
      valueAr: value.ar,
    });
  }

  return result;
}

export function mapProductImages(
  images: PublicProductImageDto[],
  altEn: string,
  altAr: string,
): ProductDetailImage[] {
  return [...images]
    .map((image) => normalizePublicProductImageDto(image))
    .filter((image): image is PublicProductImageDto => image != null)
    .filter((image) => !!(image.imageUrl || image.mediaUrl || image.videoUrl || image.iosMediaUrl))
    .sort((a, b) => {
      const primaryDiff = Number(b.isPrimary ?? false) - Number(a.isPrimary ?? false);
      return primaryDiff !== 0 ? primaryDiff : (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    })
    .map((image) => {
      let mediaType = normalizeStorefrontMediaType(image.mediaType);
      const model3d = resolveModel3dViewerSources(image);
      if (model3d.src || model3d.iosSrc) {
        mediaType = 'Model3D';
      } else if (mediaType === 'Image' && isStorefront3DAssetUrl(image.imageUrl)) {
        mediaType = 'Model3D';
      }

      const mediaUrl =
        mediaType === 'Model3D'
          ? model3d.src
          : resolveAttachmentUrlOptional(
              resolveStorefrontMediaUrl(mediaType, image.mediaUrl, image.videoUrl),
            );

      return {
        id: String(image.id),
        url: resolveProductPosterUrl(image.imageUrl),
        altEn: image.altText ?? altEn,
        altAr: image.altText ?? altAr,
        mediaType,
        mediaUrl,
        iosMediaUrl: model3d.iosSrc,
      };
    });
}

export function mapProductVariants(variants: PublicProductVariantDto[]): ProductDetailVariant[] {
  return variants.map((variant) => {
    const price = variant.price?.finalPrice ?? variant.price?.customerPrice ?? 0;
    const compareAtPrice =
      variant.price?.basePrice != null && variant.price.basePrice > price
        ? variant.price.basePrice
        : undefined;
    const stock = {
      isAvailable: canPurchase(variant.stock, variant.availabilityStatus),
      stockQuantity: variant.stock?.available ?? 0,
    };

    return {
      id: variant.id,
      stock: variant.stock,
      productId: variant.productId,
      name: variant.variantName?.trim() || variant.variantSKU || `Variant ${variant.id}`,
      sku: variant.variantSKU ?? `VAR-${variant.id}`,
      price,
      compareAtPrice,
      isAvailable: stock.isAvailable,
      stockQuantity: stock.stockQuantity,
      offers: variant.offers ?? variant.price?.offers ?? [],
    };
  });
}

export interface ProductDetailMapOverrides {
  images?: ProductDetailImage[];
  specifications?: ProductDetailSpec[];
}

export function mapPublicProductDetailsToProductDetail(
  dto: PublicProductDetailsDto,
  overrides?: ProductDetailMapOverrides,
): ProductDetail {
  const productId = dto.productId || dto.id || 0;
  const nameEn = dto.nameEn?.trim() || dto.name;
  const nameAr = dto.nameAr?.trim() || dto.name;
  const brandNameEn = dto.brand?.nameEn || dto.brandName || '';
  const brandNameAr = dto.brand?.nameAr || dto.brandName || brandNameEn;
  const categoryNameEn = dto.category?.nameEn || dto.categoryName || '';
  const categoryNameAr = dto.category?.nameAr || dto.categoryName || categoryNameEn;
  const price = resolveDetailsPrice(dto);
  const compareAtPrice = dto.oldPrice != null && dto.oldPrice > price ? dto.oldPrice : undefined;
  const stock = {
    isAvailable: canPurchase(dto.stock, dto.availabilityStatus),
    stockQuantity: dto.stock?.available ?? 0,
  };
  const { descriptionEn, descriptionAr } = resolveProductDescriptions(dto);

  const images =
    overrides?.images ??
    mapProductImages(dto.images ?? [], nameEn, nameAr) ??
    (dto.mainImageUrl
      ? [
          {
            id: 'main',
            url: resolveProductPosterUrl(dto.mainImageUrl),
            altEn: nameEn,
            altAr: nameAr,
          },
        ]
      : [{ id: 'placeholder', altEn: nameEn, altAr: nameAr }]);

  const specifications =
    overrides?.specifications ??
    mapProductSpecifications(
      (dto.specifications ?? []).filter((s) => s.isItemSpecification === true),
    );

  return {
    id: productId,
    stock: dto.stock,
    slug: dto.slug ?? undefined,
    nameEn,
    nameAr,
    brandId: String(dto.brandId ?? dto.brand?.id ?? ''),
    brandNameEn,
    brandNameAr,
    categoryId: String(dto.categoryId ?? dto.category?.id ?? ''),
    categorySlug: dto.category?.slug,
    categoryNameEn,
    categoryNameAr,
    price,
    compareAtPrice,
    discountPercent: dto.discountPercent ?? undefined,
    isAvailable: stock.isAvailable,
    stockQuantity: stock.stockQuantity,
    sku: dto.sku ?? `SKU-${productId}`,
    images,
    shortDescriptionEn: dto.shortDescriptionEn?.trim() || undefined,
    shortDescriptionAr: dto.shortDescriptionAr?.trim() || undefined,
    descriptionEn,
    descriptionAr,
    metaTitle: dto.metaTitle?.trim() || undefined,
    metaKeywords: dto.metaKeywords?.trim() || undefined,
    metaDescription: dto.metaDescription?.trim() || undefined,
    specifications,
    shippingInfoEn: 'Delivery timing is confirmed after order validation.',
    shippingInfoAr: 'يتم تأكيد موعد التوصيل بعد التحقق من الطلب.',
    returnsInfoEn: 'Free returns within 14 days of delivery.',
    returnsInfoAr: 'إرجاع مجاني خلال 14 يوماً من الاستلام.',
    isNew: dto.isNewArrival,
    isBestSeller: dto.isBestSeller,
    hasVariants: requiresModel(dto.stock),
    productVariantId: null,
    offers: dto.offers ?? dto.price?.offers ?? [],
  };
}

export function applyVariantSelectionToProduct(
  product: ProductDetail,
  variant: ProductDetailVariant | null,
  context: ProductDetailVariantContext,
): ProductDetail {
  return {
    ...product,
    price: context.price,
    compareAtPrice: context.compareAtPrice,
    discountPercent: context.discountPercent,
    variantName: variant?.name,
    sku: context.sku,
    stock: context.stock,
    isAvailable: context.isAvailable,
    stockQuantity: context.stock?.available ?? 0,
    images: context.images,
    specifications: context.specifications,
    selectedVariantId: context.productVariantId,
    productVariantId: context.productVariantId,
    offers: context.offers,
  };
}

export function applyFinalPriceToProduct(
  product: ProductDetail,
  finalPrice: PublicFinalPriceDto,
): ProductDetail {
  const compareAtPrice =
    (product.priceQuantity ?? 1) === 1 && finalPrice.basePrice > finalPrice.finalPrice
      ? finalPrice.basePrice
      : undefined;

  return {
    ...product,
    price: finalPrice.finalPrice,
    compareAtPrice,
    discountPercent:
      compareAtPrice != null
        ? Math.round(((compareAtPrice - finalPrice.finalPrice) / compareAtPrice) * 100)
        : undefined,
    productVariantId: finalPrice.productVariantId,
    offers: finalPrice.offers ?? product.offers,
  };
}

export function mapRelatedProductToListingProduct(
  item: PublicRelatedProductDto,
  _lang: AppLang,
): CatalogListingProduct {
  const inStock = canPurchase(item.stock, item.availabilityStatus);
  const brandName = item.brandName ?? '';
  const media = resolveProductListingMedia({
    mainImageUrl: item.mainImageUrl,
    mainMediaType: item.mainMediaType,
    hasModel3D: item.hasModel3D,
    images: item.images,
  });

  return {
    id: item.productId ?? item.id,
    stock: item.stock,
    productVariantId: null,
    slug: item.slug,
    nameEn: item.nameEn?.trim() || item.name,
    nameAr: item.nameAr?.trim() || item.name,
    price: item.finalPrice,
    compareAtPrice: item.oldPrice ?? undefined,
    categoryId: String(item.categoryId),
    categoryNameEn: item.categoryName ?? '',
    categoryNameAr: item.categoryName ?? '',
    brandId: item.brandId != null ? String(item.brandId) : '',
    brandNameEn: brandName,
    brandNameAr: brandName,
    isAvailable: inStock,
    isNew: item.isNewArrival,
    isBestSeller: item.isBestSeller,
    isFeatured: item.isFeatured,
    hasOffer:
      (item.offers?.length ?? 0) > 0 ||
      (item.discountPercent != null && item.discountPercent > 0) ||
      (item.oldPrice != null && item.oldPrice > item.finalPrice),
    discountPercent: item.discountPercent ?? undefined,
    imageUrl: media.posterUrl,
    has3D: media.has3D,
    createdAt: '',
    offers: item.offers ?? [],
  };
}

export function mapRelatedProductsToListingProducts(
  items: PublicRelatedProductDto[],
  lang: AppLang,
): CatalogListingProduct[] {
  return items.map((item) => mapRelatedProductToListingProduct(item, lang));
}

export function parseProductRouteParam(param: string | null): {
  productId?: number;
  slug?: string;
} {
  if (!param?.trim()) {
    return {};
  }
  const value = param.trim();
  if (/^\d+$/.test(value)) {
    return { productId: Number(value) };
  }
  return { slug: value };
}

export function resolveProductLoadRef(
  slugParam: string | null | undefined,
  productIdQuery: string | null | undefined,
): { productId?: number; slug?: string } {
  const p = productIdQuery?.trim();
  if (p && /^\d+$/.test(p)) {
    return { productId: Number(p) };
  }

  const slug = slugParam?.trim();
  if (slug && /^\d+$/.test(slug)) {
    return { productId: Number(slug) };
  }

  if (slug) {
    return { slug };
  }

  return {};
}

export function productDetailLinkSegment(product: { id: number; slug?: string | null }): string {
  return product.slug?.trim() || String(product.id);
}
