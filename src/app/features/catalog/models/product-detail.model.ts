export interface ProductDetailImage {
  id: string;
  url?: string;
  altEn: string;
  altAr: string;
}

export interface ProductDetailSpec {
  labelEn: string;
  labelAr: string;
  valueEn: string;
  valueAr: string;
}

export type ProductDetailInfoTab = 'description' | 'specifications' | 'shipping';

export interface ProductDetailVariant {
  id: number;
  productId: number;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  isAvailable: boolean;
}

export interface ProductDetail {
  id: number;
  slug?: string;
  nameEn: string;
  nameAr: string;
  brandId: string;
  brandNameEn: string;
  brandNameAr: string;
  categoryId: string;
  categorySlug?: string;
  categoryNameEn: string;
  categoryNameAr: string;
  price: number;
  compareAtPrice?: number;
  discountPercent?: number;
  rating?: number;
  reviewCount?: number;
  isAvailable: boolean;
  stockQuantity: number;
  sku: string;
  images: ProductDetailImage[];
  descriptionEn: string;
  descriptionAr: string;
  specifications: ProductDetailSpec[];
  shippingInfoEn: string;
  shippingInfoAr: string;
  returnsInfoEn: string;
  returnsInfoAr: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  hasVariants?: boolean;
  selectedVariantId?: number | null;
  productVariantId?: number | null;
}

export type ProductDetailLoadState = 'idle' | 'loading' | 'loaded' | 'not-found';

export interface ProductDetailVariantContext {
  images: ProductDetailImage[];
  specifications: ProductDetailSpec[];
  price: number;
  compareAtPrice?: number;
  discountPercent?: number;
  sku: string;
  isAvailable: boolean;
  productVariantId: number | null;
}
