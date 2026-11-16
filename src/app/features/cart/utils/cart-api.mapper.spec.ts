import { describe, expect, it } from 'vitest';

import { normalizeCartDto } from './cart-api.mapper';
import { enrichCartItems } from './cart-enrichment.util';

describe('promotion cart mapping', () => {
  it('normalizes camelCase promotion fields and preserves zero-valued reward lines', () => {
    const cart = normalizeCartDto({
      id: 701,
      productDiscountAmount: 0,
      bundleDiscountAmount: 50,
      couponDiscountAmount: 0,
      taxAmount: 0,
      totalAmount: 100,
      offerGuidance: [
        {
          offerId: 7,
          code: 'B2G1',
          statusCode: 'Applied',
          isEligible: true,
          isApplied: true,
          blocksCheckout: false,
        },
      ],
      items: [
        {
          id: 7103,
          productId: 33,
          productVariantId: 3301,
          quantity: 3,
          unitPrice: 50,
          finalPrice: 100,
          totalPrice: 100,
          selectedReward: true,
          productDiscountTotal: 0,
          bundleDiscountTotal: 50,
          couponDiscountTotal: 0,
          bundleUsedQuantity: 3,
          rewardQuantity: 1,
        },
        {
          id: 7104,
          productId: 34,
          productVariantId: 3401,
          quantity: 1,
          unitPrice: 25,
          finalPrice: 0,
          totalPrice: 0,
          selectedReward: true,
          rewardQuantity: 1,
        },
      ],
    });

    expect(cart.SupportsPromotionPricing).toBe(true);
    expect(cart.TotalAmount).toBe(100);
    expect(cart.OfferGuidance?.[0].statusCode).toBe('Applied');
    expect(cart.Items[0].BundleDiscountTotal).toBe(50);

    const lines = enrichCartItems(cart.Items, true);
    expect(lines[0].lineTotal).toBe(100);
    expect(lines[0].rewardQuantity).toBe(1);
    expect(lines[1].lineTotal).toBe(0);
    expect(lines[1].unitPrice).toBe(0);
  });

  it('keeps legacy responses on the existing interpretation path', () => {
    const cart = normalizeCartDto({
      CartId: 10,
      Total: 80,
      Items: [{ CartDetailId: 11, ProductId: 1, Quantity: 1, UnitPrice: 100, FinalPrice: 80 }],
    });

    expect(cart.SupportsPromotionPricing).toBe(false);
    expect(enrichCartItems(cart.Items)[0].lineTotal).toBe(80);
  });

  it('maps product type onto the cart line and leaves it blank when null', () => {
    const cart = normalizeCartDto({
      id: 1,
      items: [
        {
          id: 1,
          productId: 9,
          quantity: 1,
          unitPrice: 10,
          finalPrice: 10,
          productTypeId: null,
          productTypeNameAr: null,
          productTypeNameEn: null,
          howToUseAr: null,
          howToUseEn: null,
        },
        {
          id: 2,
          productId: 10,
          quantity: 1,
          unitPrice: 10,
          finalPrice: 10,
          ProductTypeId: 4,
          ProductTypeNameAr: 'سيروم',
          ProductTypeNameEn: 'Serum',
          HowToUseAr: 'طريقة',
          HowToUseEn: 'How',
        },
      ],
    });

    const lines = enrichCartItems(cart.Items);
    expect(lines[0].productTypeEn).toBe('');
    expect(lines[0].productTypeAr).toBe('');
    expect(cart.Items[1].HowToUseEn).toBe('How');
    expect(cart.Items[1].HowToUseAr).toBe('طريقة');
    expect(lines[1].productTypeEn).toBe('Serum');
    expect(lines[1].productTypeAr).toBe('سيروم');
  });
});
