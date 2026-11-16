import { describe, expect, it } from 'vitest';

import type {
  PublicProductDetailsDto,
  PublicProductVariantDto,
} from '../models/catalog-public-product.model';
import { localizedHowToUse, localizedProductTypeName, localizedShortDescription } from './product-detail.util';
import {
  mapProductVariants,
  mapPublicProductDetailsToProductDetail,
  normalizePublicProductDetailsDto,
} from './product-detail-api.mapper';

describe('product-detail-api.mapper stock', () => {
  it('uses calculated stock rather than the legacy model quantity', () => {
    const variants = mapProductVariants([
      {
        id: 22,
        productId: 4421,
        variantSKU: 'SKU-22',
        variantName: '100ml',
        quantity: 100,
        stock: { available: 7, controlType: 2, lotType: 2, allowOnlineBackorder: false },
        availabilityStatus: 'InStock',
        price: { finalPrice: 550, customerPrice: 550, basePrice: 550 },
      },
      {
        id: 23,
        productId: 4421,
        variantSKU: 'SKU-23',
        variantName: '50ml',
        quantity: 3,
        stock: { available: -2, controlType: 2, lotType: 2, allowOnlineBackorder: true },
        availabilityStatus: 'InStock',
        price: { finalPrice: 550, customerPrice: 550, basePrice: 550 },
      },
    ] as PublicProductVariantDto[]);

    expect(variants[0]?.stockQuantity).toBe(7);
    expect(variants[1]?.stockQuantity).toBe(-2);
    expect(variants[1]?.isAvailable).toBe(true);
  });

  it('keeps the language-specific short descriptions for the buy box', () => {
    const detail = mapPublicProductDetailsToProductDetail({
      id: 9,
      name: 'Serum',
      categoryId: 1,
      shortDescriptionEn: ' Light daily serum ',
      shortDescriptionAr: ' سيروم يومي خفيف ',
    } as PublicProductDetailsDto);

    expect(detail.shortDescriptionEn).toBe('Light daily serum');
    expect(detail.shortDescriptionAr).toBe('سيروم يومي خفيف');
    expect(localizedShortDescription(detail, 'en')).toBe('Light daily serum');
    expect(localizedShortDescription(detail, 'ar')).toBe('سيروم يومي خفيف');
  });

  it('leaves type and how to use empty when the payload is null', () => {
    const detail = mapPublicProductDetailsToProductDetail({
      id: 1,
      name: 'Serum',
      categoryId: 1,
      productTypeId: null,
      productType: null,
      productTypeName: null,
      productTypeNameAr: null,
      productTypeNameEn: null,
      howToUse: null,
      howToUseAr: null,
      howToUseEn: null,
    } as PublicProductDetailsDto);

    expect(detail.productTypeId).toBe('');
    expect(localizedProductTypeName(detail, 'en')).toBe('');
    expect(localizedProductTypeName(detail, 'ar')).toBe('');
    expect(localizedHowToUse(detail, 'en')).toBe('');
    expect(localizedHowToUse(detail, 'ar')).toBe('');
  });

  it('prefers the nested product type and falls back how-to-use text by language', () => {
    const detail = mapPublicProductDetailsToProductDetail({
      id: 2,
      name: 'Cream',
      categoryId: 1,
      productTypeId: 4,
      productTypeName: 'Treatment',
      productType: {
        id: 4,
        name: 'Treatment',
        nameAr: 'علاج',
        nameEn: 'Treatment',
        count: 2,
        productsCount: 2,
      },
      howToUse: 'Apply daily',
      howToUseAr: ' يوضع يومياً ',
      howToUseEn: '   ',
    } as PublicProductDetailsDto);

    expect(detail.productTypeId).toBe('4');
    expect(localizedProductTypeName(detail, 'ar')).toBe('علاج');
    expect(localizedProductTypeName(detail, 'en')).toBe('Treatment');
    expect(localizedHowToUse(detail, 'ar')).toBe('يوضع يومياً');
    expect(localizedHowToUse(detail, 'en')).toBe('Apply daily');
  });

  it('reads PascalCase product type and how to use', () => {
    const dto = normalizePublicProductDetailsDto({
      Id: 3,
      Name: 'Oil',
      CategoryId: 1,
      ProductTypeId: 8,
      ProductTypeNameEn: 'Oil',
      ProductTypeNameAr: 'زيت',
      HowToUseEn: 'Warm first',
      HowToUseAr: 'يسخن أولاً',
      ProductType: { Id: 8, NameEn: 'Oil', NameAr: 'زيت', Count: 1, ProductsCount: 4 },
    });
    const detail = mapPublicProductDetailsToProductDetail(dto!);

    expect(detail.productTypeNameEn).toBe('Oil');
    expect(detail.productTypeNameAr).toBe('زيت');
    expect(dto?.productType?.productsCount).toBe(4);
    expect(localizedHowToUse(detail, 'en')).toBe('Warm first');
    expect(localizedHowToUse(detail, 'ar')).toBe('يسخن أولاً');
  });
});
