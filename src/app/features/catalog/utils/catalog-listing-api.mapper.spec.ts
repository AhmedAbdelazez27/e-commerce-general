import { describe, expect, it } from 'vitest';

import type { PublicSearchProductDto } from '../models/catalog-public-listing.model';
import {
  mapSearchProductToListingProduct,
  resolveSearchProductCompareAtPrice,
} from './catalog-listing-api.mapper';

function product(overrides: Partial<PublicSearchProductDto> = {}): PublicSearchProductDto {
  return {
    id: 33,
    slug: 'test-product',
    sku: 'SKU-33',
    name: 'Test product',
    categoryId: 1,
    categoryName: 'Test',
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    finalPrice: 90,
    hasVariants: true,
    availabilityStatus: 'InStock',
    price: {
      productVariantId: 3301,
      basePrice: 100,
      customerPrice: 100,
      discountAmount: 10,
      couponDiscountAmount: 0,
      taxAmount: 0,
      finalPrice: 90,
    },
    ...overrides,
  };
}

describe('catalog listing compare-at price', () => {
  it('uses the server customer price when OldPrice is not populated', () => {
    const mapped = mapSearchProductToListingProduct(product(), 'en');

    expect(mapped.price).toBe(90);
    expect(mapped.compareAtPrice).toBe(100);
    expect(mapped.hasOffer).toBe(true);
  });

  it('prefers an explicit OldPrice', () => {
    expect(resolveSearchProductCompareAtPrice(product({ oldPrice: 120 }))).toBe(120);
  });

  it('does not show a crossed-out price when no server price is higher', () => {
    const item = product({
      finalPrice: 100,
      oldPrice: 0,
      price: {
        productVariantId: 3301,
        basePrice: 100,
        customerPrice: 100,
        discountAmount: 0,
        couponDiscountAmount: 0,
        taxAmount: 0,
        finalPrice: 100,
      },
    });

    expect(resolveSearchProductCompareAtPrice(item)).toBeUndefined();
  });
});
