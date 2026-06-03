import { PublicCategoryDto } from '../../../layout/models/catalog-public.model';
import {
  categoryShopQueryParams,
  SHOP_ROUTE,
} from '../../../shared/utils/category-shop-link.util';
import { HomeCategoryShortcut } from '../models/home.model';

const DEFAULT_ICON = 'fa-solid fa-tag';

export function mapCategoryToHomeShortcut(node: PublicCategoryDto): HomeCategoryShortcut {
  return {
    id: String(node.id),
    nameEn: node.nameEn,
    nameAr: node.nameAr,
    description: node.description ?? undefined,
    descriptionEn: node.description ?? undefined,
    descriptionAr: node.description ?? undefined,
    route: SHOP_ROUTE,
    queryParams: categoryShopQueryParams(node),
    iconClass: DEFAULT_ICON,
    productCount: node.count ?? 0,
    imageUrl: node.imageUrl ?? null,
    isFeatured: node.isFeatured,
  };
}
