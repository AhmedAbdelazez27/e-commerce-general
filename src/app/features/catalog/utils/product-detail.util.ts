import { AppLang } from '../../../core/services/language.service';
import { ProductCardData } from '../../../shared/models/product-card.model';
import { CatalogBreadcrumbItem } from '../models/catalog-listing.model';
import { ProductDetail, ProductDetailSpec, ProductDetailVariant } from '../models/product-detail.model';
import { mapCatalogProductToCardData } from './catalog-product.mapper';
import { CatalogListingProduct } from '../models/catalog-listing.model';
import { productHasOffer } from './catalog-listing-filter.util';
import { pickProductDetailPosterUrl, productDetailHas3D } from './catalog-media.util';

export function localizedProductName(product: ProductDetail, lang: AppLang): string {
  return lang === 'ar' ? product.nameAr : product.nameEn;
}

export function localizedShortDescription(product: ProductDetail, lang: AppLang): string {
  const text = lang === 'ar' ? product.shortDescriptionAr : product.shortDescriptionEn;
  return text?.trim() ?? '';
}

export function localizedBrandName(product: ProductDetail, lang: AppLang): string {
  return lang === 'ar' ? product.brandNameAr : product.brandNameEn;
}

export function localizedProductTypeName(product: ProductDetail, lang: AppLang): string {
  const name = lang === 'ar' ? product.productTypeNameAr : product.productTypeNameEn;
  return name?.trim() ?? '';
}

export function localizedHowToUse(product: ProductDetail, lang: AppLang): string {
  const text =
    lang === 'ar' ? product.howToUseAr || product.howToUse : product.howToUseEn || product.howToUse;
  return text?.trim() ?? '';
}

export function localizedCategoryName(product: ProductDetail, lang: AppLang): string {
  return lang === 'ar' ? product.categoryNameAr : product.categoryNameEn;
}

function localizedSpecValue(spec: ProductDetailSpec, lang: AppLang): string {
  const value = lang === 'ar' ? spec.valueAr : spec.valueEn;
  const trimmed = value.trim();
  return trimmed === '—' ? '' : trimmed;
}

function localizedSpecLabel(spec: ProductDetailSpec, lang: AppLang): string {
  return (lang === 'ar' ? spec.labelAr : spec.labelEn).trim();
}

export interface VariantOptionPart {
  kind: 'swatch' | 'text';
  value: string;
}

/** One clickable row in the product buy-box variant picker. */
export interface VariantPickerOption {
  key: string;
  variantId: number;
  /** Hex color when this option is a swatch circle. */
  color?: string;
  /** Visible non-color text (shade, size, etc.). */
  text: string;
  /** True when the control should render as a bare color circle. */
  swatchOnly: boolean;
  label: string;
}

/** Specs as swatches (hex color) or text parts for the variant picker. */
export function variantOptionParts(
  variant: ProductDetailVariant,
  lang: AppLang,
): VariantOptionPart[] {
  const parts: VariantOptionPart[] = [];
  for (const spec of variant.specifications) {
    if (spec.color) {
      parts.push({ kind: 'swatch', value: spec.color });
      continue;
    }
    const text = localizedSpecValue(spec, lang);
    if (text) {
      parts.push({ kind: 'text', value: text });
    }
  }
  if (!parts.length && variant.name.trim()) {
    parts.push({ kind: 'text', value: variant.name });
  }
  return parts;
}

/** Accessible / plain-text label; color hex codes are omitted when a swatch is shown. */
export function variantOptionLabel(variant: ProductDetailVariant, lang: AppLang): string {
  const values = variantOptionParts(variant, lang)
    .filter((part) => part.kind === 'text')
    .map((part) => part.value);
  if (values.length) {
    return values.join(' · ');
  }
  return variant.name;
}

/**
 * Expands each color swatch into its own option so every returned hex is clickable.
 * Multiple colors on one variant become multiple circles that still select that variant.
 */
export function variantPickerOptions(
  variants: ProductDetailVariant[],
  lang: AppLang,
): VariantPickerOption[] {
  const options: VariantPickerOption[] = [];
  for (const variant of variants) {
    const parts = variantOptionParts(variant, lang);
    const swatches = parts.filter((part) => part.kind === 'swatch').map((part) => part.value);
    const text = parts
      .filter((part) => part.kind === 'text')
      .map((part) => part.value)
      .join(' · ');
    const baseLabel = text || variant.name;

    if (swatches.length) {
      for (const color of swatches) {
        options.push({
          key: `${variant.id}:${color.toLowerCase()}`,
          variantId: variant.id,
          color,
          text,
          swatchOnly: !text,
          label: text ? `${baseLabel} (${color})` : `${variant.name} (${color})`,
        });
      }
      continue;
    }

    options.push({
      key: String(variant.id),
      variantId: variant.id,
      text: baseLabel,
      swatchOnly: false,
      label: baseLabel,
    });
  }
  return options;
}

/** Label of the first filterable specification, such as Color. */
export function variantGroupLabel(variants: ProductDetailVariant[], lang: AppLang): string {
  const specs = variants.flatMap((variant) => variant.specifications);
  const spec = specs.find((item) => item.isFilterable) ?? specs[0];
  return spec ? localizedSpecLabel(spec, lang) : '';
}

export function productDetailDiscountPercent(product: ProductDetail): number | null {
  if (product.discountPercent != null && product.discountPercent > 0) {
    return Math.round(product.discountPercent);
  }
  if (product.compareAtPrice != null && product.compareAtPrice > product.price) {
    return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
  }
  return null;
}

export function buildProductDetailBreadcrumbs(product: ProductDetail): CatalogBreadcrumbItem[] {
  const categoryQuery: Record<string, string> = { categoryId: product.categoryId };
  if (product.categorySlug) {
    categoryQuery['category'] = product.categorySlug;
  }

  return [
    { labelKey: 'PAGE.HOME', route: '/home' },
    { labelKey: 'PAGE.SHOP', route: '/shop' },
    {
      labelEn: product.categoryNameEn,
      labelAr: product.categoryNameAr,
      route: '/shop',
      queryParams: categoryQuery,
    },
    {
      labelEn: product.nameEn,
      labelAr: product.nameAr,
      current: true,
    },
  ];
}

export function mapRelatedToCardData(
  related: CatalogListingProduct[],
  lang: AppLang = 'en',
): ProductCardData[] {
  return related.map((p) => mapCatalogProductToCardData(p, lang));
}

export function mapProductDetailToCardData(product: ProductDetail): ProductCardData {
  const discount = productDetailDiscountPercent(product);

  return {
    id: product.id,
    productVariantId: product.productVariantId ?? null,
    variantName: product.variantName,
    variantSku: product.sku,
    stock: product.stock,
    slug: product.slug,
    title: product.nameEn,
    titleAr: product.nameAr,
    brand: product.brandNameEn,
    productTypeEn: product.productTypeNameEn?.trim() || undefined,
    productTypeAr: product.productTypeNameAr?.trim() || product.productTypeNameEn?.trim() || undefined,
    image: pickProductDetailPosterUrl(product.images),
    has3D: productDetailHas3D(product.images),
    price: product.price,
    oldPrice: product.compareAtPrice,
    discountPercentage: discount ?? undefined,
    rating: product.rating,
    reviewsCount: product.reviewCount,
    isAvailable: product.isAvailable,
    offers: product.offers ?? [],
  };
}

export function listingProductHasOffer(product: CatalogListingProduct): boolean {
  return productHasOffer(product);
}
