/** EcPublicCatalog category tree node (ABP `result` item). */
export interface PublicCategoryDto {
  id: number;
  parentCategoryId: number | null;
  name: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
  isFeatured: boolean;
  sortOrder: number;
  count: number;
  children: PublicCategoryDto[];
}

/** EcPublicCatalog home hero slider (ABP `result` item). */
export interface PublicHomeSliderDto {
  id: number;
  title: string;
  titleAr: string;
  titleEn: string;
  subtitle: string;
  subtitleAr: string;
  subtitleEn: string;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  buttonText: string;
  buttonTextAr: string;
  buttonTextEn: string;
  targetType: string;
  targetId: number;
  targetSlug: string | null;
  linkUrl: string | null;
  sortOrder: number;
}

/** EcPublicCatalog brand (ABP `result` item). */
export interface PublicBrandDto {
  id: number;
  name: string;
  nameAr: string;
  nameEn: string;
  logoUrl?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
  isFeatured: boolean;
  count: number;
}

/** EcPublicCatalog FAQ (ABP `result` item). */
export interface PublicFaqDto {
  id: number;
  categoryLkpId: number;
  categoryNameAr: string;
  categoryNameEn: string;
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
  imageUrl: string | null;
  videoUrl: string | null;
  pdfAttachmentUrl: string | null;
  displayOrder: number;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
}

export interface SearchFaqsRequest {
  searchText: string;
  categoryLkpId?: number;
}

export interface RateFaqRequest {
  id: number;
  isHelpful: boolean;
}
