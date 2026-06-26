import { describe, expect, it } from 'vitest';

import { CartDto, CartItemDto } from '../models/cart.model';
import { CartLineItemView } from '../models/cart-view.model';
import {
  buildOrderSummary,
  cartItemsHaveEmbeddedProductDiscount,
  resolveCartMerchandiseTotals,
} from './cart-summary.util';

function lineItem(lineTotal: number): CartLineItemView {
  return {
    cartDetailId: 1,
    productId: 1,
    titleEn: 'Test',
    titleAr: 'اختبار',
    brandEn: '',
    brandAr: '',
    unitPrice: lineTotal,
    quantity: 1,
    lineTotal,
    isAvailable: true,
    maxQuantity: 99,
  };
}

function rawItem(
  unitPrice: number,
  finalPrice?: number,
  quantity = 1,
): CartItemDto {
  const price = finalPrice ?? unitPrice;
  return {
    CartDetailId: 1,
    ProductId: 1,
    Quantity: quantity,
    UnitPrice: unitPrice,
    FinalPrice: finalPrice,
    LineTotal: price * quantity,
  };
}

describe('cart-summary.util', () => {
  describe('cartItemsHaveEmbeddedProductDiscount', () => {
    it('returns true when FinalPrice is below UnitPrice', () => {
      expect(cartItemsHaveEmbeddedProductDiscount([rawItem(100, 80)])).toBe(true);
    });

    it('returns false when prices match or FinalPrice is missing', () => {
      expect(cartItemsHaveEmbeddedProductDiscount([rawItem(100)])).toBe(false);
      expect(cartItemsHaveEmbeddedProductDiscount([rawItem(100, 100)])).toBe(false);
    });
  });

  describe('resolveCartMerchandiseTotals', () => {
    it('ignores product DiscountAmount when discount is embedded in line prices', () => {
      const cart: CartDto = {
        Items: [rawItem(100, 80)],
        SubTotal: 80,
        DiscountAmount: 20,
        Total: 80,
      };

      const totals = resolveCartMerchandiseTotals(
        cart,
        [lineItem(80)],
        cart.Items,
      );

      expect(totals).toEqual({
        subtotal: 80,
        discount: 0,
        merchandiseTotal: 80,
      });
    });

    it('applies coupon discount on top of embedded product prices', () => {
      const cart: CartDto = {
        Items: [rawItem(100, 80)],
        SubTotal: 80,
        DiscountAmount: 20,
        CouponDiscountAmount: 10,
        Total: 70,
      };

      const totals = resolveCartMerchandiseTotals(
        cart,
        [lineItem(80)],
        cart.Items,
      );

      expect(totals).toEqual({
        subtotal: 80,
        discount: 10,
        merchandiseTotal: 70,
      });
    });

    it('uses applied coupon discount before cart refresh when embedded', () => {
      const cart: CartDto = {
        Items: [rawItem(100, 80)],
        SubTotal: 80,
        DiscountAmount: 20,
        Total: 80,
      };

      const totals = resolveCartMerchandiseTotals(
        cart,
        [lineItem(80)],
        cart.Items,
        15,
      );

      expect(totals).toEqual({
        subtotal: 80,
        discount: 15,
        merchandiseTotal: 80,
      });
    });

    it('keeps gross subtotal pattern when line prices are not discounted', () => {
      const cart: CartDto = {
        Items: [rawItem(100)],
        SubTotal: 100,
        DiscountAmount: 20,
        Total: 80,
      };

      const totals = resolveCartMerchandiseTotals(
        cart,
        [lineItem(100)],
        cart.Items,
      );

      expect(totals).toEqual({
        subtotal: 100,
        discount: 20,
        merchandiseTotal: 80,
      });
    });
  });

  describe('buildOrderSummary', () => {
    it('uses merchandiseTotal without subtracting discount again', () => {
      const summary = buildOrderSummary(80, 1, {
        discountAmount: 0,
        merchandiseTotal: 80,
        deliveryFee: 0,
      });

      expect(summary.total).toBe(80);
      expect(summary.discount).toBe(0);
    });

    it('adds delivery fee to merchandiseTotal', () => {
      const summary = buildOrderSummary(80, 1, {
        discountAmount: 10,
        merchandiseTotal: 70,
        deliveryFee: 2.5,
      });

      expect(summary.total).toBe(72.5);
    });
  });
});
