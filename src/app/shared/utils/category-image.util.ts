/** Shown when EcPublicCatalog returns `imageUrl: null`. */
export const CATEGORY_PLACEHOLDER_IMAGE = '/images/category-placeholder.svg';

export function resolveCategoryImageUrl(imageUrl: string | null | undefined): string {
  const trimmed = imageUrl?.trim();
  return trimmed ? trimmed : CATEGORY_PLACEHOLDER_IMAGE;
}
