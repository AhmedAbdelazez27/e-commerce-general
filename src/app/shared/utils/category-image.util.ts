import { resolveAttachmentUrl } from '../../core/utils/attachment-url.util';

/** Shown when EcPublicCatalog returns `imageUrl: null`. */
export const CATEGORY_PLACEHOLDER_IMAGE = '/images/category-placeholder.svg';

export function resolveCategoryImageUrl(imageUrl: string | null | undefined): string {
  return resolveAttachmentUrl(imageUrl) ?? CATEGORY_PLACEHOLDER_IMAGE;
}
