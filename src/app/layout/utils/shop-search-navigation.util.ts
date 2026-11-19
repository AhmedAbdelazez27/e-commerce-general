import { Params } from '@angular/router';

export function shopPathname(url: string): string {
  const path = url.split(/[?#]/)[0] || '/';
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

/** Builds shop query params for a text search. On /shop, category and filters stay; page and product deep-link drop. */
export function buildShopSearchQueryParams(
  currentPath: string,
  currentParams: Params,
  shopRoute: string,
  searchText: string,
): Params {
  const q = searchText.trim();
  if (shopPathname(currentPath) !== shopRoute) {
    return q ? { q } : {};
  }

  const queryParams: Params = { ...currentParams };
  delete queryParams['p'];
  delete queryParams['page'];
  if (q) {
    queryParams['q'] = q;
  } else {
    delete queryParams['q'];
  }
  return queryParams;
}
