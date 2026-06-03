import { PublicCategoryDto } from '../../layout/models/catalog-public.model';

export const SHOP_ROUTE = '/shop';

export function categoryShopQueryParams(node: PublicCategoryDto): Record<string, string> {
  return {
    category: node.slug,
    categoryId: String(node.id),
  };
}

export function categoryDisplayName(
  node: Pick<PublicCategoryDto, 'nameEn' | 'nameAr'>,
  lang: 'ar' | 'en',
): string {
  return lang === 'ar' ? node.nameAr : node.nameEn;
}
