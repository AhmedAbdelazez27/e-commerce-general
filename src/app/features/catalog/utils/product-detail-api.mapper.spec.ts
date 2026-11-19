import { describe, expect, it } from 'vitest';

import type {
  PublicProductDetailsDto,
  PublicProductVariantDto,
} from '../models/catalog-public-product.model';
import {
  localizedHowToUse,
  localizedProductTypeName,
  localizedShortDescription,
  variantGroupLabel,
  variantOptionLabel,
  variantOptionParts,
  variantPickerOptions,
} from './product-detail.util';
import {
  mapProductVariants,
  mapPublicProductDetailsToProductDetail,
  normalizePublicProductDetailsDto,
  normalizePublicProductSpecificationDto,
  resolveSpecificationColor,
  resolveVariantGalleryImages,
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

  it('shows color and shade when the shade is stored as a number or as text', () => {
    const variants = mapProductVariants([
      {
        id: 41593,
        productId: 21602,
        variantSKU: 'RED',
        variantName: 'Red',
        specifications: [
          {
            id: 4,
            specificationTypeId: 2,
            specificationNameAr: 'اللون',
            specificationNameEn: 'Color',
            code: 'COLOR',
            dataType: 'Text',
            textValue: 'RED',
            isFilterable: true,
          },
          {
            id: 5,
            specificationTypeId: 3,
            specificationNameAr: 'الدرجة',
            specificationNameEn: 'Shade',
            code: 'SAHDE',
            dataType: 'Number',
            numericValue: 210,
            isFilterable: false,
          },
        ],
      },
      {
        id: 41594,
        productId: 21602,
        variantSKU: 'Black',
        variantName: 'Black',
        specifications: [
          {
            id: 1,
            specificationTypeId: 2,
            specificationNameAr: 'اللون',
            specificationNameEn: 'Color',
            textValue: 'Black',
            isFilterable: true,
          },
          {
            id: 2,
            specificationTypeId: 3,
            specificationNameAr: 'الدرجة',
            specificationNameEn: 'Shade',
            dataType: 'Number',
            numericValue: null,
            textValue: '209',
            isFilterable: false,
          },
        ],
      },
    ] as PublicProductVariantDto[]);

    expect(variantOptionLabel(variants[0]!, 'ar')).toBe('RED · 210');
    expect(variantOptionLabel(variants[1]!, 'en')).toBe('Black · 209');
    expect(variantGroupLabel(variants, 'ar')).toBe('اللون');
    expect(variants[0]?.specifications[0]?.isFilterable).toBe(true);
    expect(variants[0]?.specifications[0]?.color).toBeUndefined();
  });

  it('maps IsColor hex TextValue to a swatch and keeps plain text when IsColor is false', () => {
    expect(resolveSpecificationColor(true, '#C45C26')).toBe('#C45C26');
    expect(resolveSpecificationColor(true, '#0001')).toBe('#0001');
    expect(resolveSpecificationColor(true, 'RED')).toBeUndefined();
    expect(resolveSpecificationColor(false, '#C45C26')).toBeUndefined();

    const colorSpec = normalizePublicProductSpecificationDto({
      Id: 10,
      SpecificationTypeId: 2,
      SpecificationNameEn: 'Color',
      SpecificationNameAr: 'اللون',
      IsColor: true,
      TextValue: '#C45C26',
      IsFilterable: true,
    });
    expect(colorSpec?.isColor).toBe(true);
    expect(colorSpec?.textValue).toBe('#C45C26');

    const variants = mapProductVariants([
      {
        id: 1,
        productId: 9,
        variantName: 'Copper',
        specifications: [
          {
            id: 10,
            specificationTypeId: 2,
            specificationNameEn: 'Color',
            textValue: '#C45C26',
            isColor: true,
            isFilterable: true,
          },
          {
            id: 11,
            specificationTypeId: 3,
            specificationNameEn: 'Shade',
            numericValue: 210,
            isColor: false,
          },
        ],
      },
      {
        id: 2,
        productId: 9,
        variantName: 'Named red',
        specifications: [
          {
            id: 12,
            specificationTypeId: 2,
            specificationNameEn: 'Color',
            textValue: 'RED',
            isColor: false,
            isFilterable: true,
          },
        ],
      },
    ] as PublicProductVariantDto[]);

    expect(variants[0]?.specifications[0]?.color).toBe('#C45C26');
    expect(variantOptionParts(variants[0]!, 'en')).toEqual([
      { kind: 'swatch', value: '#C45C26' },
      { kind: 'text', value: '210' },
    ]);
    expect(variantOptionLabel(variants[0]!, 'en')).toBe('210');
    expect(variants[1]?.specifications[0]?.color).toBeUndefined();
    expect(variantOptionLabel(variants[1]!, 'en')).toBe('RED');
  });

  it('keeps every distinct color swatch when they share one specification type', () => {
    const variants = mapProductVariants([
      {
        id: 41640,
        productId: 4787,
        variantName: 'test',
        specifications: [
          {
            id: 88,
            specificationTypeId: 9,
            specificationNameEn: 'Color',
            specificationNameAr: 'اللون',
            textValue: '#198F21',
            isColor: true,
          },
          {
            id: 89,
            specificationTypeId: 9,
            specificationNameEn: 'Color',
            textValue: '#821C1C',
            isColor: true,
          },
          {
            id: 90,
            specificationTypeId: 9,
            specificationNameEn: 'Color',
            textValue: '#E81717',
            isColor: true,
          },
        ],
      },
    ] as PublicProductVariantDto[]);

    expect(variants[0]?.specifications.map((spec) => spec.color)).toEqual([
      '#198F21',
      '#821C1C',
      '#E81717',
    ]);
    expect(variantOptionParts(variants[0]!, 'ar')).toEqual([
      { kind: 'swatch', value: '#198F21' },
      { kind: 'swatch', value: '#821C1C' },
      { kind: 'swatch', value: '#E81717' },
    ]);
    expect(variantPickerOptions(variants, 'ar').map((option) => option.color)).toEqual([
      '#198F21',
      '#821C1C',
      '#E81717',
    ]);
    expect(variantPickerOptions(variants, 'ar').every((option) => option.swatchOnly)).toBe(true);
  });

  it('keeps the product images when a variant image has no renderable url', () => {
    const fallback = [{ id: 'base', url: '/products/default.jpg', altEn: 'Serum', altAr: 'سيروم' }];

    expect(resolveVariantGalleryImages([{ id: 9 }], fallback, 'Serum', 'سيروم')).toEqual(fallback);
    expect(resolveVariantGalleryImages([{ id: 9, imageUrl: '/variants/red.jpg' }], fallback, 'Serum', 'سيروم')[0]?.id).toBe('9');
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
