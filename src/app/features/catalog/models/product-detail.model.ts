import type { ProductStock } from '../../../shared/models/product-stock.model';
import { StorefrontMediaType } from '../../../shared/utils/storefront-media.util';
import type { PublicOfferBadge } from '../../../shared/models/promotion.model';

export interface ProductDetailImage {
  id: string;
  url?: string;
  altEn: string;
  altAr: string;
  mediaType?: StorefrontMediaType;
  /** `.glb` / `.gltf` for the 3D viewer. */
  mediaUrl?: string;
  /** `.usdz` for iOS AR. */
  iosMediaUrl?: string;
}

export interface ProductDetailSpec {
  labelEn: string;
  labelAr: string;
  valueEn: string;
  valueAr: string;
}

export type ProductDetailInfoTab = 'description' | 'specifications' | 'shipping';

export interface ProductDetailVariant {
  stock?: ProductStock;
  id: number;
  productId: number;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  isAvailable: boolean;
  stockQuantity: number;
  offers?: PublicOfferBadge[];
}

export interface ProductDetail {
  variantName?: string;
  baseImages?: ProductDetailImage[];
  priceQuantity?: number;
  stock?: ProductStock;
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
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
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
  offers?: PublicOfferBadge[];
}

export type ProductDetailLoadState = 'idle' | 'loading' | 'loaded' | 'not-found';

export interface ProductDetailVariantContext {
  stock?: ProductStock;
  images: ProductDetailImage[];
  specifications: ProductDetailSpec[];
  price: number;
  compareAtPrice?: number;
  discountPercent?: number;
  sku: string;
  isAvailable: boolean;
  productVariantId: number | null;
  offers: PublicOfferBadge[];
}
