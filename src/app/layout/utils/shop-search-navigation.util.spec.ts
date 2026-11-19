import { describe, expect, it } from 'vitest';

import { buildShopSearchQueryParams } from './shop-search-navigation.util';

describe('buildShopSearchQueryParams', () => {
  it('starts a store-wide search from other pages', () => {
    expect(buildShopSearchQueryParams('/home', { coupon: 'A' }, '/shop', ' كريم ')).toEqual({
      q: 'كريم',
    });
  });

  it('keeps the current shop filters and resets paging', () => {
    expect(
      buildShopSearchQueryParams(
        '/shop',
        { categoryId: '314', category: '314', brand: ['2'], page: '2', sort: 'newest' },
        '/shop',
        'moisturizer',
      ),
    ).toEqual({
      categoryId: '314',
      category: '314',
      brand: ['2'],
      sort: 'newest',
      q: 'moisturizer',
    });
  });

  it('drops the product deep link when searching the shop', () => {
    expect(
      buildShopSearchQueryParams('/shop', { p: '99', categoryId: '314' }, '/shop', 'sku-1'),
    ).toEqual({
      categoryId: '314',
      q: 'sku-1',
    });
  });

  it('clears the search term without dropping the category', () => {
    expect(
      buildShopSearchQueryParams('/shop', { categoryId: '314', q: 'cream', page: '3' }, '/shop', '  '),
    ).toEqual({
      categoryId: '314',
    });
  });
});
