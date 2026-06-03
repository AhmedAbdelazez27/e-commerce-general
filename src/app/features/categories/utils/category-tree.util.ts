import { PublicCategoryDto } from '../../../layout/models/catalog-public.model';

export function sortCategoryNodes(nodes: PublicCategoryDto[]): PublicCategoryDto[] {
  return [...nodes].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function rootCategoriesFromTree(tree: PublicCategoryDto[]): PublicCategoryDto[] {
  return sortCategoryNodes(tree);
}

/** Flattens the full tree (root → children → grandchildren) into one list. */
export function flattenCategoriesTree(tree: PublicCategoryDto[]): PublicCategoryDto[] {
  const flat: PublicCategoryDto[] = [];

  const walk = (nodes: PublicCategoryDto[]): void => {
    for (const node of sortCategoryNodes(nodes)) {
      flat.push(node);
      if (node.children?.length) {
        walk(node.children);
      }
    }
  };

  walk(tree);
  return flat;
}
