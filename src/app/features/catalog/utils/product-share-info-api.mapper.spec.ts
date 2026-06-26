import { describe, expect, it } from 'vitest';

import { normalizeProductShareInfoDto } from './product-share-info-api.mapper';

describe('product-share-info-api.mapper', () => {
  it('normalizes ABP share info payload', () => {
    const result = normalizeProductShareInfoDto({
      productId: 4419,
      slug: 'lash-sensational-mascara',
      share: {
        url: 'http://compassint.ddns.net:2043/shop/lash-sensational-mascara?p=4419',
        titleAr: 'ماسكارا لاش سينسيشنال',
        titleEn: 'Lash Sensational Mascara',
        descriptionAr: 'وصف عربي',
        descriptionEn: 'English description',
        imageUrl: 'http://example.com/image.png',
      },
    });

    expect(result).toEqual({
      productId: 4419,
      slug: 'lash-sensational-mascara',
      share: {
        url: 'http://compassint.ddns.net:2043/shop/lash-sensational-mascara?p=4419',
        titleAr: 'ماسكارا لاش سينسيشنال',
        titleEn: 'Lash Sensational Mascara',
        descriptionAr: 'وصف عربي',
        descriptionEn: 'English description',
        imageUrl: 'http://example.com/image.png',
      },
    });
  });

  it('supports PascalCase fields', () => {
    const result = normalizeProductShareInfoDto({
      ProductId: 10,
      Slug: 'test-product',
      Share: {
        Url: 'http://example.com/shop/test-product?p=10',
        TitleEn: 'Test',
        TitleAr: 'اختبار',
        DescriptionEn: 'Desc',
        DescriptionAr: 'وصف',
        ImageUrl: 'http://example.com/img.png',
      },
    });

    expect(result?.productId).toBe(10);
    expect(result?.share.url).toBe('http://example.com/shop/test-product?p=10');
  });

  it('returns null for invalid payload', () => {
    expect(normalizeProductShareInfoDto(null)).toBeNull();
    expect(normalizeProductShareInfoDto({ productId: 0, share: { url: '' } })).toBeNull();
  });
});
