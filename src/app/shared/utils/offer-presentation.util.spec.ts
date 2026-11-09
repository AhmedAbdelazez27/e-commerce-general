import { describe, expect, it } from 'vitest';

import type { OfferDefinition, OfferDefinitionDetail } from '../models/promotion.model';
import {
  offerDetailsForRole,
  quantityTierDetails,
  resolveOfferBenefitPresentation,
  resolveOfferRolePresentation,
  resolveQualificationPresentation,
} from './offer-presentation.util';

function offer(overrides: Partial<OfferDefinition> = {}): OfferDefinition {
  return {
    id: 1,
    code: 'internal-code',
    nameAr: 'عرض',
    nameEn: 'Offer',
    typeCode: 'FixedPackage',
    priority: 1,
    qualifyingQuantity: 0,
    rewardQuantity: 0,
    minimumSpend: 0,
    benefitValue: 0,
    details: [],
    ...overrides,
  };
}

function detail(
  id: number,
  roleCode: string,
  quantity: number,
  benefitValue = 0,
): OfferDefinitionDetail {
  return {
    id,
    roleCode,
    targetTypeCode: 'Product',
    includeSubcategories: false,
    quantity,
    benefitValue,
  };
}

describe('offer presentation', () => {
  it.each([
    [['Qualify'], 'OFFERS.ROLES.QUALIFY'],
    [['Reward'], 'OFFERS.ROLES.REWARD'],
    [['Component'], 'OFFERS.ROLES.COMPONENT'],
    [['Reward', 'Qualify'], 'OFFERS.ROLES.QUALIFY_REWARD'],
    [['Reward', 'Component'], 'OFFERS.ROLES.COMPONENT_REWARD'],
    [['Component', 'Qualify'], 'OFFERS.ROLES.QUALIFY_COMPONENT'],
    [['Reward', 'Qualify', 'Component'], 'OFFERS.ROLES.QUALIFY_COMPONENT_REWARD'],
  ])('maps customer roles %s to %s regardless of order', (roles, key) => {
    expect(resolveOfferRolePresentation(roles)?.labelKey).toBe(key);
  });

  it('deduplicates known roles and hides Tier-only or unknown protocol roles', () => {
    expect(resolveOfferRolePresentation(['Reward', 'Reward', 'Tier'])?.roles).toEqual(['Reward']);
    expect(resolveOfferRolePresentation(['Tier'])).toBeNull();
    expect(resolveOfferRolePresentation(['InternalFutureRole'])).toBeNull();
  });

  it('keeps the role presentation scoped to each offer', () => {
    expect(resolveOfferRolePresentation(['Qualify'])?.labelKey).toBe('OFFERS.ROLES.QUALIFY');
    expect(resolveOfferRolePresentation(['Reward'])?.labelKey).toBe('OFFERS.ROLES.REWARD');
  });

  it.each([
    ['FixedPackage', { benefitValue: 25, currencyId: 7 }, 'OFFERS.BENEFIT.FIXED_PACKAGE'],
    ['PackagePercent', { benefitValue: 15 }, 'OFFERS.BENEFIT.PACKAGE_PERCENT'],
    [
      'BuyXGetYSame',
      { qualifyingQuantity: 2, rewardQuantity: 1 },
      'OFFERS.BENEFIT.BUY_X_GET_Y_SAME',
    ],
    ['BuyXGetY', { qualifyingQuantity: 2, rewardQuantity: 1 }, 'OFFERS.BENEFIT.BUY_X_GET_Y'],
    [
      'BuyXGetYDiscount',
      { qualifyingQuantity: 2, rewardQuantity: 1, benefitValue: 50 },
      'OFFERS.BENEFIT.BUY_X_GET_Y_DISCOUNT',
    ],
    [
      'MixFixed',
      { qualifyingQuantity: 3, benefitValue: 40, currencyId: 7 },
      'OFFERS.BENEFIT.MIX_FIXED',
    ],
    ['MixCheapest', { qualifyingQuantity: 3, rewardQuantity: 1 }, 'OFFERS.BENEFIT.MIX_CHEAPEST'],
    ['QuantityTier', {}, 'OFFERS.BENEFIT.QUANTITY_TIER'],
    [
      'SpendGift',
      { minimumSpend: 100, rewardQuantity: 1, currencyId: 7 },
      'OFFERS.BENEFIT.SPEND_GIFT',
    ],
  ])('provides a customer summary for %s', (typeCode, values, key) => {
    expect(
      resolveOfferBenefitPresentation(offer({ typeCode, ...values }), { id: 7, code: 'AED' }).key,
    ).toBe(key);
  });

  it('does not label a fixed amount with a mismatched selected currency', () => {
    expect(
      resolveOfferBenefitPresentation(
        offer({ typeCode: 'FixedPackage', benefitValue: 25, currencyId: 7 }),
        { id: 8, code: 'USD' },
      ).key,
    ).toBe('OFFERS.BENEFIT.FIXED_PACKAGE_NEUTRAL');
  });

  it('describes pooled and all-groups qualification differently', () => {
    expect(
      resolveQualificationPresentation(
        offer({ qualificationModeCode: 'Pooled', qualifyingQuantity: 3 }),
      ),
    ).toEqual({ key: 'OFFERS.QUALIFICATION.POOLED', params: { quantity: 3 } });
    expect(resolveQualificationPresentation(offer({ qualificationModeCode: 'AllGroups' }))).toEqual(
      { key: 'OFFERS.QUALIFICATION.ALL_GROUPS' },
    );
  });

  it('keeps role product groups separate and sorts valid quantity tiers', () => {
    const current = offer({
      details: [
        detail(1, 'Qualify', 1),
        detail(2, 'Reward', 1),
        detail(3, 'Tier', 5, 20),
        detail(4, 'Tier', 2, 10),
        detail(5, 'Tier', 0, 50),
      ],
    });

    expect(offerDetailsForRole(current, 'Qualify').map((item) => item.id)).toEqual([1]);
    expect(offerDetailsForRole(current, 'Reward').map((item) => item.id)).toEqual([2]);
    expect(quantityTierDetails(current).map((item) => item.id)).toEqual([4, 3]);
  });
});
