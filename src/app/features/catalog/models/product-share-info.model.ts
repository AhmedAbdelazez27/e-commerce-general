export interface PublicProductShareDto {
  url: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl?: string;
}

export interface PublicProductShareInfoDto {
  productId: number;
  slug?: string;
  share: PublicProductShareDto;
}
