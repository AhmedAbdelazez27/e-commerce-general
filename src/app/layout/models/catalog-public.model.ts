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
