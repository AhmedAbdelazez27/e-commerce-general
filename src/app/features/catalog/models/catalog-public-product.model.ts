import { PublicSearchProductPriceDto } from './catalog-public-listing.model';

export interface GetProductDetailsParams {
  productId?: number;
  slug?: string;
  lang?: string;
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
  mediaType?: string | null;
  videoUrl?: string | null;
}

export interface PublicProductSpecificationDto {
  id: number;
  productVariantId?: number;
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
  id: number;
  productId: number;
  variantSKU?: string;
  variantName?: string;
  additionalPrice?: number;
  sortOrder?: number;
  availabilityStatus?: string;
  price?: PublicSearchProductPriceDto;
  images?: PublicProductImageDto[];
  specifications?: PublicProductSpecificationDto[];
}

export interface PublicProductDetailsDto {
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
}

export interface PublicRelatedProductDto {
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
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  oldPrice?: number | null;
  finalPrice: number;
  discountPercent?: number | null;
  availabilityStatus?: string;
}

export interface ProductDetailLoadRef {
  productId?: number;
  slug?: string;
}

export interface PublicFinalPriceDto {
  productVariantId: number;
  basePrice: number;
  customerPrice: number;
  discountAmount: number;
  couponDiscountAmount: number;
  taxAmount: number;
  finalPrice: number;
  appliedDiscountName?: string | null;
  appliedCouponCode?: string | null;
}
