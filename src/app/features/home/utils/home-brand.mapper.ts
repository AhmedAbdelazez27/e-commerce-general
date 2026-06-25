import { PublicBrandDto } from '../../../layout/models/catalog-public.model';
import { resolveAttachmentUrlOptional } from '../../../core/utils/attachment-url.util';
import {
  brandInitials,
  brandShopQueryParams,
  brandShopRoute,
  sortPublicBrands,
} from '../../../shared/utils/brand-display.util';
import { HomeBrandCard } from '../models/home.model';

export const HOME_BRANDS_MAX_ITEMS = 8;

export function resolveHomeBrandsLimit(maxItems?: number): number {
  const requested = maxItems != null && maxItems > 0 ? maxItems : HOME_BRANDS_MAX_ITEMS;
  return Math.min(requested, HOME_BRANDS_MAX_ITEMS);
}

export function mapPublicBrandToHomeBrandCard(dto: PublicBrandDto): HomeBrandCard {
  const displayName = dto.nameEn?.trim() || dto.name?.trim() || '';

  return {
    id: String(dto.id),
    nameEn: dto.nameEn,
    nameAr: dto.nameAr,
    name: dto.name,
    route: brandShopRoute(),
    queryParams: brandShopQueryParams(dto),
    logoUrl: resolveAttachmentUrlOptional(dto.logoUrl),
    initials: brandInitials(displayName),
  };
}

export function mapPublicBrandsToHomeBrandCards(
  brands: PublicBrandDto[],
  maxItems?: number,
): HomeBrandCard[] {
  const limit = resolveHomeBrandsLimit(maxItems);
  return sortPublicBrands(brands).slice(0, limit).map(mapPublicBrandToHomeBrandCard);
}
