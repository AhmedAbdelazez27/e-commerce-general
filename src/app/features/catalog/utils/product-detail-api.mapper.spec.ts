import { describe, expect, it } from 'vitest';

import type {
  PublicProductDetailsDto,
  PublicProductVariantDto,
} from '../models/catalog-public-product.model';
import { localizedShortDescription } from './product-detail.util';
import {
  mapProductVariants,
  mapPublicProductDetailsToProductDetail,
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
});
