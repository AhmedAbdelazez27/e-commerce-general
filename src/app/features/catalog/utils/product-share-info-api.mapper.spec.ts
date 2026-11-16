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

  it('preserves embedded offer badges when the updated API returns them', () => {
    const result = normalizeProductShareInfoDto({
      productId: 4419,
      share: { url: '/shop/4419' },
      offers: [
        {
          offerId: 7,
          code: 'B2G1',
          nameEn: 'Buy 2 get 1 free',
          nameAr: 'اشتر قطعتين واحصل على الثالثة مجاناً',
          roles: ['Qualify', 'Reward'],
          matchingVariantIds: [81],
        },
      ],
    });

    expect(result?.offers?.[0]).toMatchObject({
      offerId: 7,
      code: 'B2G1',
      matchingVariantIds: [81],
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

  it('keeps null type and how to use off the share payload', () => {
    const result = normalizeProductShareInfoDto({
      productId: 1,
      share: { url: '/shop/1' },
      productTypeId: null,
      productTypeNameAr: null,
      productTypeNameEn: null,
      howToUseAr: null,
      howToUseEn: null,
    });

    expect(result?.productTypeId).toBeUndefined();
    expect(result?.productTypeNameAr).toBeUndefined();
    expect(result?.productTypeNameEn).toBeUndefined();
    expect(result?.howToUseAr).toBeUndefined();
    expect(result?.howToUseEn).toBeUndefined();
  });

  it('reads PascalCase product type and how to use', () => {
    const result = normalizeProductShareInfoDto({
      ProductId: 2,
      Share: { Url: '/shop/2' },
      ProductTypeId: 4,
      ProductTypeNameAr: 'سيروم',
      ProductTypeNameEn: 'Serum',
      HowToUseAr: 'طريقة',
      HowToUseEn: 'How',
    });

    expect(result).toMatchObject({
      productId: 2,
      productTypeId: 4,
      productTypeNameAr: 'سيروم',
      productTypeNameEn: 'Serum',
      howToUseAr: 'طريقة',
      howToUseEn: 'How',
    });
  });

  it('returns null for invalid payload', () => {
    expect(normalizeProductShareInfoDto(null)).toBeNull();
    expect(normalizeProductShareInfoDto({ productId: 0, share: { url: '' } })).toBeNull();
  });
});
