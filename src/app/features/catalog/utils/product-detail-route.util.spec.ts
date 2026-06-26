import { describe, expect, it } from 'vitest';

import { resolveProductLoadRef } from './product-detail-api.mapper';

describe('resolveProductLoadRef', () => {
  it('prefers ?p= query param as ProductId', () => {
    expect(resolveProductLoadRef('lash-sensational-mascara', '4419')).toEqual({
      productId: 4419,
    });
  });

  it('uses query param when slug is missing', () => {
    expect(resolveProductLoadRef(null, '4419')).toEqual({ productId: 4419 });
  });

  it('falls back to slug when query param is missing', () => {
    expect(resolveProductLoadRef('lash-sensational-mascara', null)).toEqual({
      slug: 'lash-sensational-mascara',
    });
  });

  it('treats numeric slug as ProductId when query param is missing', () => {
    expect(resolveProductLoadRef('4419', null)).toEqual({ productId: 4419 });
  });

  it('returns empty ref when both params are missing', () => {
    expect(resolveProductLoadRef(null, null)).toEqual({});
    expect(resolveProductLoadRef('', '')).toEqual({});
  });
});
