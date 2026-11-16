import { describe, expect, it } from 'vitest';

import { buildCatalogPageTokens, skipCountFromPageParam } from './catalog-pagination.util';

describe('catalog pagination', () => {
  it('maps the page query to skipCount', () => {
    expect(skipCountFromPageParam(null)).toBe(0);
    expect(skipCountFromPageParam('1')).toBe(0);
    expect(skipCountFromPageParam('3', 20)).toBe(40);
    expect(skipCountFromPageParam('nope')).toBe(0);
  });

  it('keeps a short page list intact', () => {
    expect(buildCatalogPageTokens(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('collapses distant pages into ellipses', () => {
    expect(buildCatalogPageTokens(1, 20)).toEqual([1, 2, 3, 'ellipsis', 20]);
    expect(buildCatalogPageTokens(10, 20)).toEqual([1, 'ellipsis', 9, 10, 11, 'ellipsis', 20]);
    expect(buildCatalogPageTokens(19, 20)).toEqual([1, 'ellipsis', 18, 19, 20]);
  });
});
