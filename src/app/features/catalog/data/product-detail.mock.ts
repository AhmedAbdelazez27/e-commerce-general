import { CATALOG_LISTING_PRODUCTS } from './catalog-listing.mock';
import { ProductDetail, ProductDetailImage, ProductDetailSpec } from '../models/product-detail.model';
import { CatalogListingProduct } from '../models/catalog-listing.model';

const DETAIL_COPY: Record<
  string,
  {
    descriptionEn: string;
    descriptionAr: string;
    shippingInfoEn: string;
    shippingInfoAr: string;
    returnsInfoEn: string;
    returnsInfoAr: string;
    extraSpecs?: ProductDetailSpec[];
  }
> = {
  default: {
    descriptionEn:
      'A carefully selected product designed for everyday use. Formulated for reliable results and suitable for a wide range of needs.',
    descriptionAr:
      'منتج مختار بعناية للاستخدام اليومي. تركيبة موثوقة ومناسبة لمجموعة واسعة من الاحتياجات.',
    shippingInfoEn:
      'Standard delivery in 2–5 business days. Free shipping may apply on qualifying orders in eligible areas.',
    shippingInfoAr:
      'التوصيل القياسي خلال 2–5 أيام عمل. قد يتوفر الشحن المجاني للطلبات المؤهلة في المناطق المدعومة.',
    returnsInfoEn:
      'Return unopened items within 14 days. Proof of purchase required. Some exclusions apply.',
    returnsInfoAr:
      'إرجاع المنتجات غير المفتوحة خلال 14 يوماً. يلزم إثبات الشراء. تنطبق بعض الاستثناءات.',
  },
};

function baseSpecs(product: CatalogListingProduct): ProductDetailSpec[] {
  return [
    {
      labelEn: 'SKU',
      labelAr: 'رمز المنتج',
      valueEn: `SKU-${product.id}`,
      valueAr: `SKU-${product.id}`,
    },
    {
      labelEn: 'Category',
      labelAr: 'الفئة',
      valueEn: product.categoryNameEn,
      valueAr: product.categoryNameAr,
    },
    {
      labelEn: 'Brand',
      labelAr: 'العلامة',
      valueEn: product.brandNameEn,
      valueAr: product.brandNameAr,
    },
  ];
}

function buildImages(product: CatalogListingProduct): ProductDetailImage[] {
  const name = product.nameEn;
  const base: ProductDetailImage[] = [
    { id: 'main', url: product.imageUrl, altEn: name, altAr: product.nameAr },
    { id: 'alt-1', altEn: `${name} — view 2`, altAr: `${product.nameAr} — منظر 2` },
    { id: 'alt-2', altEn: `${name} — view 3`, altAr: `${product.nameAr} — منظر 3` },
    { id: 'alt-3', altEn: `${name} — detail`, altAr: `${product.nameAr} — تفصيل` },
  ];
  return base;
}

export function buildProductDetailFromListing(product: CatalogListingProduct): ProductDetail {
  const copy = DETAIL_COPY['default'];
  const stock = product.isAvailable ? Math.max(1, 24 - (product.id % 20)) : 0;

  return {
    id: product.id,
    nameEn: product.nameEn,
    nameAr: product.nameAr,
    brandId: product.brandId,
    brandNameEn: product.brandNameEn,
    brandNameAr: product.brandNameAr,
    categoryId: product.categoryId,
    categoryNameEn: product.categoryNameEn,
    categoryNameAr: product.categoryNameAr,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    discountPercent: product.discountPercent,
    rating: product.rating,
    reviewCount: product.reviewCount,
    isAvailable: product.isAvailable,
    stockQuantity: stock,
    sku: `SKU-${product.id}`,
    images: buildImages(product),
    descriptionEn: copy.descriptionEn,
    descriptionAr: copy.descriptionAr,
    specifications: [...baseSpecs(product), ...(copy.extraSpecs ?? [])],
    shippingInfoEn: copy.shippingInfoEn,
    shippingInfoAr: copy.shippingInfoAr,
    returnsInfoEn: copy.returnsInfoEn,
    returnsInfoAr: copy.returnsInfoAr,
    isNew: product.isNew,
    isBestSeller: product.isBestSeller,
  };
}

const DETAIL_BY_ID = new Map(
  CATALOG_LISTING_PRODUCTS.map((p) => [p.id, buildProductDetailFromListing(p)]),
);

/** Replace with API repository when backend is ready. */
export function getMockProductDetail(id: number): ProductDetail | null {
  return DETAIL_BY_ID.get(id) ?? null;
}

export function getMockRelatedProducts(productId: number, limit = 4): CatalogListingProduct[] {
  const current = CATALOG_LISTING_PRODUCTS.find((p) => p.id === productId);
  if (!current) {
    return CATALOG_LISTING_PRODUCTS.slice(0, limit);
  }
  return CATALOG_LISTING_PRODUCTS.filter(
    (p) => p.id !== productId && p.categoryId === current.categoryId,
  ).slice(0, limit);
}
