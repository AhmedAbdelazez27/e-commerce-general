import { CATALOG_PAGE_SIZE } from './catalog-listing-api.mapper';

export type CatalogPageToken = number | 'ellipsis';

/** Converts a `page` query value into the SearchProducts skipCount. */
export function skipCountFromPageParam(
  value: string | null,
  pageSize = CATALOG_PAGE_SIZE,
): number {
  const page = Number(value);
  if (!Number.isFinite(page) || page <= 1) {
    return 0;
  }
  return (Math.floor(page) - 1) * pageSize;
}

/** Page numbers with ellipses, keeping the current page and the ends visible. */
export function buildCatalogPageTokens(current: number, total: number): CatalogPageToken[] {
  if (total <= 0) {
    return [];
  }

  const safeCurrent = Math.min(Math.max(1, Math.floor(current)), total);
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, safeCurrent]);
  if (safeCurrent > 1) {
    pages.add(safeCurrent - 1);
  }
  if (safeCurrent < total) {
    pages.add(safeCurrent + 1);
  }
  if (safeCurrent <= 3) {
    pages.add(2);
    pages.add(3);
  }
  if (safeCurrent >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
  }

  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const tokens: CatalogPageToken[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      tokens.push('ellipsis');
    }
    tokens.push(page);
  });
  return tokens;
}
