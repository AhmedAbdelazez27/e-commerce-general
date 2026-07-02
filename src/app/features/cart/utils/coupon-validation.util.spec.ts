import { describe, expect, it } from 'vitest';

import type { ValidateCouponResultDto } from '../../checkout/models/validate-coupon.model';
import {
  resolveValidatedCouponDiscount,
  validateCouponApiResult,
} from './coupon-validation.util';

function validResult(
  overrides: Partial<ValidateCouponResultDto> = {},
): ValidateCouponResultDto {
  return {
    validDate: 'Yes',
    isActive: 1,
    usageLimit: null,
    discountAmount: 50,
    validAmount: 'Yes',
    remainingAmountToBeUsed: 0,
    ...overrides,
  };
}

describe('coupon-validation.util', () => {
  describe('resolveValidatedCouponDiscount', () => {
    it('uses discountAmount when usageLimit is null', () => {
      expect(resolveValidatedCouponDiscount(validResult({ discountAmount: 50 }))).toBe(50);
    });

    it('uses usageLimit when it is lower than discountAmount (once per order cap)', () => {
      expect(
        resolveValidatedCouponDiscount(
          validResult({ discountAmount: 5000, usageLimit: 50 }),
        ),
      ).toBe(50);
    });

    it('keeps discountAmount when usageLimit is greater', () => {
      expect(
        resolveValidatedCouponDiscount(
          validResult({ discountAmount: 50, usageLimit: 100 }),
        ),
      ).toBe(50);
    });

    it('caps discount at order subtotal', () => {
      expect(resolveValidatedCouponDiscount(validResult({ discountAmount: 80 }), 60)).toBe(60);
    });
  });

  describe('validateCouponApiResult', () => {
    it('returns capped discount for valid coupon', () => {
      const result = validateCouponApiResult(
        validResult({ discountAmount: 5000, usageLimit: 75 }),
        1000,
      );

      expect(result).toEqual({ valid: true, discountAmount: 75 });
    });
  });
});
