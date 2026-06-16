import type { AppLang } from '../../core/services/language.service';
import { PublicBrandDto } from '../../layout/models/catalog-public.model';
import { SHOP_ROUTE } from './category-shop-link.util';

export function brandDisplayName(
  brand: { nameEn?: string; nameAr?: string; name?: string },
  lang: AppLang,
): string {
  if (lang === 'ar') {
    return brand.nameAr?.trim() || brand.name?.trim() || brand.nameEn?.trim() || '';
  }
  return brand.nameEn?.trim() || brand.name?.trim() || brand.nameAr?.trim() || '';
}

export function brandInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

export function sortPublicBrands(brands: PublicBrandDto[]): PublicBrandDto[] {
  return [...brands].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) {
      return a.isFeatured ? -1 : 1;
    }
    const countDiff = (b.count ?? 0) - (a.count ?? 0);
    if (countDiff !== 0) {
      return countDiff;
    }
    return (a.nameEn || a.name).localeCompare(b.nameEn || b.name, undefined, { sensitivity: 'base' });
  });
}

export function brandShopQueryParams(brand: PublicBrandDto): Record<string, string> {
  return { brand: String(brand.id) };
}

export function brandShopRoute(): string {
  return SHOP_ROUTE;
}
