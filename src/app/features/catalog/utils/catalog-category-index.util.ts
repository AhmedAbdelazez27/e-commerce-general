import { ParamMap } from '@angular/router';

import { PublicCategoryDto } from '../../../layout/models/catalog-public.model';

/** Lookup category nodes by slug or numeric id string. */
export function buildCategoryLookup(tree: PublicCategoryDto[]): Map<string, PublicCategoryDto> {
  const index = new Map<string, PublicCategoryDto>();

  const walk = (nodes: PublicCategoryDto[]): void => {
    for (const node of nodes) {
      index.set(node.slug, node);
      index.set(String(node.id), node);
      if (node.children?.length) {
        walk(node.children);
      }
    }
  };

  walk(tree);
  return index;
}

export function resolveCategoryRouteParam(
  param: string | null,
  lookup: Map<string, PublicCategoryDto>,
): string | null {
  if (!param) {
    return null;
  }
  if (/^\d+$/.test(param)) {
    return param;
  }
  const node = lookup.get(param);
  if (node) {
    return String(node.id);
  }
  return null;
}

/** Prefer explicit `categoryId` from nav links; fall back to slug/id in `category`. */
export function resolveCategoryFromQueryParams(
  params: ParamMap,
  lookup: Map<string, PublicCategoryDto>,
): string | null {
  const categoryIdParam = params.get('categoryId');
  if (categoryIdParam && /^\d+$/.test(categoryIdParam)) {
    return categoryIdParam;
  }
  return resolveCategoryRouteParam(params.get('category'), lookup);
}

export function categorySlugForId(
  categoryId: string | null,
  lookup: Map<string, PublicCategoryDto>,
): string | null {
  if (!categoryId) {
    return null;
  }
  return lookup.get(categoryId)?.slug ?? null;
}

export function categoryNodeForId(
  categoryId: string | null,
  lookup: Map<string, PublicCategoryDto>,
): PublicCategoryDto | null {
  if (!categoryId) {
    return null;
  }
  return lookup.get(categoryId) ?? null;
}
