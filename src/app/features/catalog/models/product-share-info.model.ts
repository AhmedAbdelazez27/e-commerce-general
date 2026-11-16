import type { PublicOfferBadge } from '../../../shared/models/promotion.model';

export interface PublicProductShareDto {
  url: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl?: string;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}

export interface PublicProductShareInfoDto {
  productId: number;
  slug?: string;
  share: PublicProductShareDto;
  offers?: PublicOfferBadge[];
  productTypeId?: number | null;
  productTypeNameAr?: string | null;
  productTypeNameEn?: string | null;
  howToUseAr?: string | null;
  howToUseEn?: string | null;
}
