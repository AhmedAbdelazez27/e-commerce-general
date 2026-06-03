import { AppLang } from '../../../core/services/language.service';
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
    .filter((image) => !!image.imageUrl)
    .sort((a, b) => {
      const primaryDiff = Number(b.isPrimary ?? false) - Number(a.isPrimary ?? false);
      return primaryDiff !== 0 ? primaryDiff : (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    })
    .map((image) => ({
      id: String(image.id),
      url: image.imageUrl ?? undefined,
      altEn: image.altText ?? altEn,
      altAr: image.altText ?? altAr,
    }));
}

export function mapProductVariants(variants: PublicProductVariantDto[]): ProductDetailVariant[] {
  return variants.map((variant) => {
    const price = variant.price?.finalPrice ?? variant.price?.customerPrice ?? 0;
    const compareAtPrice =
      variant.price?.basePrice != null && variant.price.basePrice > price
        ? variant.price.basePrice
        : undefined;

    return {
      id: variant.id,
      productId: variant.productId,
      name: variant.variantName?.trim() || variant.variantSKU || `Variant ${variant.id}`,
      sku: variant.variantSKU ?? `VAR-${variant.id}`,
      price,
      compareAtPrice,
      isAvailable: variant.availabilityStatus === 'InStock',
    };
  });
}

export function pickDefaultVariant(
  variants: ProductDetailVariant[],
  details: PublicProductDetailsDto,
): ProductDetailVariant | null {
  if (variants.length === 0) {
    return null;
  }
  if (variants.length === 1) {
    return variants[0];
  }

  const detailsVariantId = details.price?.productVariantId;
  if (detailsVariantId != null) {
    const matched = variants.find((variant) => variant.id === detailsVariantId);
    if (matched) {
      return matched;
    }
  }

  return variants.find((variant) => variant.isAvailable) ?? variants[0];
}

export function resolveProductVariantId(
  variant: ProductDetailVariant | null,
  details: PublicProductDetailsDto,
): number | null {
  if (variant) {
    return variant.id;
  }
  return details.price?.productVariantId ?? null;
}

export interface ProductDetailMapOverrides {
  images?: ProductDetailImage[];
  specifications?: ProductDetailSpec[];
}

export function mapPublicProductDetailsToProductDetail(
  dto: PublicProductDetailsDto,
  overrides?: ProductDetailMapOverrides,
): ProductDetail {
  const productId = dto.id || dto.productId || 0;
  const nameEn = dto.nameEn?.trim() || dto.name;
  const nameAr = dto.nameAr?.trim() || dto.name;
  const brandNameEn = dto.brand?.nameEn || dto.brandName || '';
  const brandNameAr = dto.brand?.nameAr || dto.brandName || brandNameEn;
  const categoryNameEn = dto.category?.nameEn || dto.categoryName || '';
  const categoryNameAr = dto.category?.nameAr || dto.categoryName || categoryNameEn;
  const price = resolveDetailsPrice(dto);
  const compareAtPrice = dto.oldPrice != null && dto.oldPrice > price ? dto.oldPrice : undefined;
  const inStock = dto.availabilityStatus === 'InStock';
  const descriptionEn = dto.description ?? dto.shortDescription ?? nameEn;
  const descriptionAr = dto.description ?? dto.shortDescription ?? nameAr;

  const images =
    overrides?.images ??
    mapProductImages(dto.images ?? [], nameEn, nameAr) ??
    (dto.mainImageUrl
      ? [{ id: 'main', url: dto.mainImageUrl, altEn: nameEn, altAr: nameAr }]
      : [{ id: 'placeholder', altEn: nameEn, altAr: nameAr }]);

  const specifications =
    overrides?.specifications ?? mapProductSpecifications(dto.specifications ?? []);

  return {
    id: productId,
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
    isAvailable: inStock,
    stockQuantity: inStock ? 99 : 0,
    sku: dto.sku ?? `SKU-${productId}`,
    images,
    descriptionEn,
    descriptionAr,
    specifications,
    shippingInfoEn: 'Standard delivery within 3–5 business days.',
    shippingInfoAr: 'التوصيل القياسي خلال 3–5 أيام عمل.',
    returnsInfoEn: 'Free returns within 14 days of delivery.',
    returnsInfoAr: 'إرجاع مجاني خلال 14 يوماً من الاستلام.',
    isNew: dto.isNewArrival,
    isBestSeller: dto.isBestSeller,
    hasVariants: (dto.hasVariants ?? false) || (dto.variants?.length ?? 0) > 1,
    productVariantId: dto.price?.productVariantId ?? null,
  };
}

export function applyVariantSelectionToProduct(
  product: ProductDetail,
  variant: ProductDetailVariant | null,
  context: ProductDetailVariantContext,
): ProductDetail {
  const price = context.price > 0 ? context.price : (variant?.price ?? product.price);
  const compareAtPrice = context.compareAtPrice ?? variant?.compareAtPrice ?? product.compareAtPrice;
  const isAvailable = variant?.isAvailable ?? context.isAvailable ?? product.isAvailable;

  return {
    ...product,
    price,
    compareAtPrice,
    discountPercent: context.discountPercent ?? product.discountPercent,
    sku: variant?.sku || context.sku || product.sku,
    isAvailable,
    stockQuantity: isAvailable ? product.stockQuantity || 99 : 0,
    images: context.images.length > 0 ? context.images : product.images,
    specifications:
      context.specifications.length > 0 ? context.specifications : product.specifications,
    selectedVariantId: variant?.id ?? product.selectedVariantId ?? null,
    productVariantId: context.productVariantId ?? variant?.id ?? product.productVariantId ?? null,
  };
}

export function applyFinalPriceToProduct(
  product: ProductDetail,
  finalPrice: PublicFinalPriceDto,
): ProductDetail {
  const compareAtPrice =
    finalPrice.basePrice > finalPrice.finalPrice ? finalPrice.basePrice : product.compareAtPrice;

  return {
    ...product,
    price: finalPrice.finalPrice,
    compareAtPrice,
    discountPercent:
      compareAtPrice != null
        ? Math.round(((compareAtPrice - finalPrice.finalPrice) / compareAtPrice) * 100)
        : product.discountPercent,
    productVariantId: finalPrice.productVariantId,
  };
}

export function mapRelatedProductToListingProduct(
  item: PublicRelatedProductDto,
  _lang: AppLang,
): CatalogListingProduct {
  const inStock = item.availabilityStatus === 'InStock';
  const brandName = item.brandName ?? '';

  return {
    id: item.productId ?? item.id,
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
      (item.discountPercent != null && item.discountPercent > 0) ||
      (item.oldPrice != null && item.oldPrice > item.finalPrice),
    discountPercent: item.discountPercent ?? undefined,
    imageUrl: item.mainImageUrl ?? undefined,
    createdAt: '',
  };
}

export function mapRelatedProductsToListingProducts(
  items: PublicRelatedProductDto[],
  lang: AppLang,
): CatalogListingProduct[] {
  return items.map((item) => mapRelatedProductToListingProduct(item, lang));
}

export function parseProductRouteParam(param: string | null): { productId?: number; slug?: string } {
  if (!param?.trim()) {
    return {};
  }
  const value = param.trim();
  if (/^\d+$/.test(value)) {
    return { productId: Number(value) };
  }
  return { slug: value };
}

export function productDetailLinkSegment(product: { id: number; slug?: string | null }): string {
  return product.slug?.trim() || String(product.id);
}
