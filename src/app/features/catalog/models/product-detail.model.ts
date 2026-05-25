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

export interface ProductDetail {
  id: number;
  nameEn: string;
  nameAr: string;
  brandId: string;
  brandNameEn: string;
  brandNameAr: string;
  categoryId: string;
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
}

export type ProductDetailLoadState = 'idle' | 'loading' | 'loaded' | 'not-found';
