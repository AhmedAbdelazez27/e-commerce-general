import { describe, expect, it } from 'vitest';

import { DEFAULT_CATALOG_FILTERS } from '../models/catalog-listing.model';
import type { PublicSearchProductDto } from '../models/catalog-public-listing.model';
import {
  buildSearchProductsRequest,
  mapFilterProductTypesToOptions,
  mapSearchProductToListingProduct,
  normalizePublicSearchProductDto,
  readFilterProductTypes,
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

describe('product type on catalog listing', () => {
  it('keeps a null type and how to use off the card name', () => {
    const dto = normalizePublicSearchProductDto({
      id: 1,
      name: 'Serum',
      productTypeId: null,
      productTypeName: null,
      productTypeNameAr: null,
      productTypeNameEn: null,
      howToUse: null,
      howToUseAr: null,
      howToUseEn: null,
    });

    expect(dto?.productTypeId).toBeNull();
    expect(dto?.productTypeName).toBeNull();
    expect(dto?.howToUse).toBeNull();
    expect(dto?.howToUseAr).toBeNull();
    expect(dto?.howToUseEn).toBeNull();

    const listing = mapSearchProductToListingProduct(dto!, 'en');
    expect(listing.productTypeId).toBe('');
    expect(listing.productTypeNameEn).toBe('');
    expect(listing.productTypeNameAr).toBe('');
  });

  it('reads PascalCase type names and falls back to ProductTypeName', () => {
    const dto = normalizePublicSearchProductDto({
      Id: 2,
      Name: 'Cream',
      ProductTypeId: 4,
      ProductTypeName: 'Serum',
      ProductTypeNameAr: ' سيروم ',
      HowToUseEn: ' Apply daily ',
    });

    expect(dto?.productTypeId).toBe(4);
    expect(dto?.productTypeNameAr).toBe('سيروم');
    expect(dto?.productTypeNameEn).toBeNull();
    expect(dto?.howToUseEn).toBe('Apply daily');

    const listing = mapSearchProductToListingProduct(dto!, 'ar');
    expect(listing.productTypeNameAr).toBe('سيروم');
    expect(listing.productTypeNameEn).toBe('Serum');
  });

  it('sends productTypeId only when one type is selected', () => {
    const currency = { id: 1, code: 'EGP' };
    const one = buildSearchProductsRequest(
      { ...DEFAULT_CATALOG_FILTERS, productTypeIds: ['4'] },
      '',
      'en',
      'newest',
      0,
      currency,
    );
    expect(one.productTypeIds).toEqual([4]);
    expect(one.productTypeId).toBe(4);

    const many = buildSearchProductsRequest(
      { ...DEFAULT_CATALOG_FILTERS, productTypeIds: ['4', '5'] },
      '',
      'en',
      'newest',
      0,
      currency,
    );
    expect(many.productTypeIds).toEqual([4, 5]);
    expect(many.productTypeId).toBeUndefined();
  });

  it('maps bilingual filter types and drops a nameless option', () => {
    const types = readFilterProductTypes({
      ProductTypes: [
        { Id: 4, Name: 'Serum', NameAr: 'سيروم', NameEn: 'Serum', Count: 3 },
        { Id: 5, Name: '   ', Count: 0 },
      ],
    });
    const options = mapFilterProductTypesToOptions(types);

    expect(options).toEqual([
      { id: '4', nameEn: 'Serum', nameAr: 'سيروم', count: 3 },
    ]);
  });
});
