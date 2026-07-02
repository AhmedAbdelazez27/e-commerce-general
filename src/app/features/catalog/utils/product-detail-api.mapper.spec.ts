import { describe, expect, it } from 'vitest';

import type { PublicProductVariantDto } from '../models/catalog-public-product.model';
import {
  mapProductVariants,
  resolveStockFromApi,
} from './product-detail-api.mapper';

describe('product-detail-api.mapper stock', () => {
  it('resolveStockFromApi maps in-stock quantity', () => {
    expect(resolveStockFromApi(100, 'InStock')).toEqual({
      stockQuantity: 100,
      isAvailable: true,
    });
  });

  it('resolveStockFromApi treats out-of-stock status as unavailable', () => {
    expect(resolveStockFromApi(100, 'OutOfStock')).toEqual({
      stockQuantity: 0,
      isAvailable: false,
    });
  });

  it('mapProductVariants carries variant quantity into stockQuantity', () => {
    const variants = mapProductVariants([
      {
        id: 22,
        productId: 4421,
        variantSKU: 'SKU-22',
        variantName: '100ml',
        quantity: 100,
        availabilityStatus: 'InStock',
        price: { finalPrice: 550, customerPrice: 550, basePrice: 550 },
      },
      {
        id: 23,
        productId: 4421,
        variantSKU: 'SKU-23',
        variantName: '50ml',
        quantity: 3,
        availabilityStatus: 'InStock',
        price: { finalPrice: 550, customerPrice: 550, basePrice: 550 },
      },
    ] as PublicProductVariantDto[]);

    expect(variants[0]?.stockQuantity).toBe(100);
    expect(variants[1]?.stockQuantity).toBe(3);
  });
});
