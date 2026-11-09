import type { ProductStock } from '../../../shared/models/product-stock.model';
import { PublicSearchProductPriceDto } from './catalog-public-listing.model';
import type { PublicOfferBadge } from '../../../shared/models/promotion.model';

export interface GetProductDetailsParams {
  productId?: number;
  slug?: string;
  lang?: string;
  currencyId?: number;
  currencyCode?: string;
}

export interface PublicProductImageDto {
  id: number;
  productId?: number;
  productVariantId?: number | null;
  imageUrl?: string | null;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
  isMain?: boolean;
  mediaTypeLkpId?: number | null;
  mediaType?: string | null;
  videoUrl?: string | null;
  mediaUrl?: string | null;
  iosMediaUrl?: string | null;
}

export interface PublicProductSpecificationDto {
  productId?: number;
  isItemSpecification?: boolean;
  id: number;
  productVariantId?: number | null;
  productVariantName?: string | null;
  specificationTypeId: number;
  specificationName?: string;
  specificationNameAr?: string;
  specificationNameEn?: string;
  code?: string;
  dataType?: string;
  numericValue?: number | null;
  textValue?: string | null;
  boolValue?: boolean | null;
  displayValue?: string | null;
  unitName?: string | null;
  unitSymbol?: string | null;
}

export interface PublicProductVariantDto {
  stock?: ProductStock;
  id: number;
  productId: number;
  variantSKU?: string;
  variantName?: string;
  additionalPrice?: number;
  quantity?: number;
  sortOrder?: number;
  availabilityStatus?: string;
  price?: PublicSearchProductPriceDto;
  images?: PublicProductImageDto[];
  specifications?: PublicProductSpecificationDto[];
  offers?: PublicOfferBadge[];
}

export interface PublicProductDetailsDto {
  stock?: ProductStock;
  id: number;
  productId?: number;
  slug?: string | null;
  sku?: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  shortDescription?: string | null;
  shortDescriptionAr?: string | null;
  shortDescriptionEn?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  metaTitle?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
  categoryId: number;
  categoryName?: string;
  brandId?: number | null;
  brandName?: string | null;
  mainImageUrl?: string | null;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  oldPrice?: number | null;
  finalPrice?: number;
  discountPercent?: number | null;
  quantity?: number;
  hasVariants?: boolean;
  availabilityStatus?: string;
  price?: PublicSearchProductPriceDto;
  taxPercent?: number;
  category?: {
    id: number;
    slug?: string;
    name?: string;
    nameAr?: string;
    nameEn?: string;
  };
  brand?: {
    id: number;
    name?: string;
    nameAr?: string;
    nameEn?: string;
  };
  images?: PublicProductImageDto[];
  variants?: PublicProductVariantDto[];
  specifications?: PublicProductSpecificationDto[];
  offers?: PublicOfferBadge[];
}

export interface PublicRelatedProductDto {
  stock?: ProductStock;
  id: number;
  productId: number;
  slug?: string;
  sku?: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  categoryId: number;
  categoryName?: string;
  brandId?: number | null;
  brandName?: string | null;
  mainImageUrl?: string | null;
  mainMediaType?: string | null;
  hasModel3D?: boolean;
  images?: PublicProductImageDto[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  oldPrice?: number | null;
  finalPrice: number;
  discountPercent?: number | null;
  availabilityStatus?: string;
  offers?: PublicOfferBadge[];
}

export interface ProductDetailLoadRef {
  productId?: number;
  slug?: string;
}

export interface PublicFinalPriceDto {
  productId?: number;
  productVariantId: number | null;
  basePrice: number;
  customerPrice: number;
  discountAmount: number;
  couponDiscountAmount: number;
  taxAmount: number;
  finalPrice: number;
  appliedDiscountName?: string | null;
  appliedCouponCode?: string | null;
  offers?: PublicOfferBadge[];
}
