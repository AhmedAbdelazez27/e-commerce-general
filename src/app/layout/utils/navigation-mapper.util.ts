import { PublicBrandDto, PublicCategoryDto } from '../models/catalog-public.model';
import { SHOP_ROUTE, categoryShopQueryParams } from '../../shared/utils/category-shop-link.util';
import { NavCategory, NavMegaColumn, NavMegaLink } from '../models/layout.model';

function categoryLink(node: PublicCategoryDto): NavMegaLink {
  return {
    id: String(node.id),
    labelEn: node.nameEn,
    labelAr: node.nameAr,
    route: SHOP_ROUTE,
    queryParams: categoryShopQueryParams(node),
  };
}

function columnFromChild(child: PublicCategoryDto): NavMegaColumn {
  const grandchildren = child.children ?? [];
  const links =
    grandchildren.length > 0 ? grandchildren.map(categoryLink) : [categoryLink(child)];

  return {
    id: String(child.id),
    titleEn: child.nameEn,
    titleAr: child.nameAr,
    links,
  };
}

function mapCategoryNode(node: PublicCategoryDto): NavCategory {
  const children = [...(node.children ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const megaMenu = children.length > 0 ? children.map(columnFromChild) : undefined;

  return {
    id: String(node.id),
    labelEn: node.nameEn,
    labelAr: node.nameAr,
    route: SHOP_ROUTE,
    queryParams: categoryShopQueryParams(node),
    megaMenu,
  };
}

export function mapCategoriesTreeToNav(tree: PublicCategoryDto[]): NavCategory[] {
  return [...tree].sort((a, b) => a.sortOrder - b.sortOrder).map(mapCategoryNode);
}

export function buildBrandsNavItem(brands: PublicBrandDto[]): NavCategory {
  const sorted = [...brands].sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  const links: NavMegaLink[] = sorted.map((brand) => ({
    id: String(brand.id),
    labelEn: brand.nameEn,
    labelAr: brand.nameAr,
    route: SHOP_ROUTE,
    queryParams: { brand: String(brand.id) },
  }));

  return {
    id: 'brands',
    labelKey: 'LAYOUT.NAV.BRANDS',
    route: '/brands',
    megaMenu: links.length
      ? [
          {
            id: 'brands-list',
            titleKey: 'LAYOUT.NAV.BRANDS',
            links,
          },
        ]
      : undefined,
  };
}
