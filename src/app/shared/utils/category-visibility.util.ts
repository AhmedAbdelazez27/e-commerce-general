import { PublicCategoryDto } from '../../layout/models/catalog-public.model';

/** Maximum parent categories shown in navigation. */
export const FEATURED_CATEGORY_LIMIT = 6;

/** Keep populated branches; older responses without counts remain navigable. */
export function visibleCategoryTree(tree: PublicCategoryDto[]): PublicCategoryDto[] {
  return tree.flatMap((node) => {
    const children = visibleCategoryTree(node.children ?? []);
    if (node.count != null && node.count <= 0 && children.length === 0) {
      return [];
    }
    return [
      {
        ...node,
        children,
        count:
          node.count === 0 && children.length > 0
            ? children.reduce((total, child) => total + (child.count ?? 0), 0)
            : node.count,
      },
    ];
  });
}

export function featuredCategoryPreview(
  tree: PublicCategoryDto[],
  limit = FEATURED_CATEGORY_LIMIT,
): PublicCategoryDto[] {
  return visibleCategoryTree(tree)
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder)
    .slice(0, Math.max(0, limit));
}
