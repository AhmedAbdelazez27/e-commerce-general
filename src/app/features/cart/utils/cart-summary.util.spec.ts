import { describe, expect, it } from 'vitest';

import { CartDto, CartItemDto } from '../models/cart.model';
import { CartLineItemView } from '../models/cart-view.model';
import {
  buildOrderSummary,
  cartItemsHaveEmbeddedProductDiscount,
  resolveCartMerchandiseTotals,
} from './cart-summary.util';

function lineItem(lineTotal: number, unitPrice = lineTotal): CartLineItemView {
  return {
    cartDetailId: 1,
    productId: 1,
    titleEn: 'Test',
    titleAr: 'اختبار',
    brandEn: '',
    brandAr: '',
    unitPrice,
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
    it('shows product discount separately when embedded in line prices', () => {
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
        subtotal: 100,
        productDiscount: 20,
        couponDiscount: 0,
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
        subtotal: 100,
        productDiscount: 20,
        couponDiscount: 10,
        merchandiseTotal: 70,
      });
    });

    it('subtracts pending coupon before cart refresh when embedded', () => {
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
        subtotal: 100,
        productDiscount: 20,
        couponDiscount: 15,
        merchandiseTotal: 65,
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
        productDiscount: 20,
        couponDiscount: 0,
        merchandiseTotal: 80,
      });
    });

    it('shows both product and coupon discounts when API splits them', () => {
      const cart: CartDto = {
        Items: [rawItem(100)],
        SubTotal: 100,
        DiscountAmount: 20,
        CouponDiscountAmount: 10,
        Total: 70,
      };

      const totals = resolveCartMerchandiseTotals(
        cart,
        [lineItem(100)],
        cart.Items,
      );

      expect(totals).toEqual({
        subtotal: 100,
        productDiscount: 20,
        couponDiscount: 10,
        merchandiseTotal: 70,
      });
    });

    it('keeps the payable total in sync with the live line items (EcCart shape)', () => {
      // Real EcCart payload: unitPrice is per unit, finalPrice/totalPrice is the whole-line net total.
      const cart: CartDto = {
        Items: [rawItem(550, 522.5, 5)],
        SubTotal: 2612.5,
        Total: 2612.5,
        CouponCode: 'HIBA',
        CouponDiscountAmount: 27.5,
      };

      const totals = resolveCartMerchandiseTotals(cart, [lineItem(2612.5, 522.5)], cart.Items);

      expect(totals.subtotal).toBe(2750);
      expect(totals.couponDiscount).toBe(137.5);
      expect(totals.productDiscount).toBe(0);
      expect(totals.merchandiseTotal).toBe(2612.5);
    });

    it('prefers client-validated coupon over multiplied cart API discount', () => {
      const cart: CartDto = {
        Items: [rawItem(100, 80, 100)],
        SubTotal: 8000,
        CouponDiscountAmount: 5000,
        Total: 3000,
      };

      const totals = resolveCartMerchandiseTotals(
        cart,
        [lineItem(8000)],
        cart.Items,
        50,
      );

      expect(totals.couponDiscount).toBe(50);
      expect(totals.merchandiseTotal).toBe(7950);
    });
  });

  describe('buildOrderSummary', () => {
    it('uses merchandiseTotal without subtracting discounts again', () => {
      const summary = buildOrderSummary(
        {
          subtotal: 100,
          productDiscount: 20,
          couponDiscount: 0,
          merchandiseTotal: 80,
        },
        1,
        { deliveryFee: 0 },
      );

      expect(summary.total).toBe(80);
      expect(summary.productDiscount).toBe(20);
      expect(summary.couponDiscount).toBe(0);
    });

    it('adds delivery fee to merchandiseTotal after both discounts', () => {
      const summary = buildOrderSummary(
        {
          subtotal: 100,
          productDiscount: 20,
          couponDiscount: 10,
          merchandiseTotal: 70,
        },
        1,
        { deliveryFee: 2.5 },
      );

      expect(summary.total).toBe(72.5);
      expect(summary.discount).toBe(30);
    });
  });
});
