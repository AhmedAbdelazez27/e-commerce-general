import type {
  OfferDefinition,
  OfferDefinitionDetail,
  OfferRoleCode,
} from '../models/promotion.model';

export type OfferRoleTone = 'qualify' | 'reward' | 'component' | 'mixed';

export interface OfferRolePresentation {
  labelKey: string;
  iconClass: string;
  tone: OfferRoleTone;
  roles: Array<'Qualify' | 'Reward' | 'Component'>;
}

export interface OfferTextPresentation {
  key: string;
  params?: Record<string, string | number>;
}

export interface OfferCurrencyContext {
  id?: number | null;
  code?: string | null;
}

const ROLE_ORDER = ['Qualify', 'Component', 'Reward'] as const;
type CustomerRole = (typeof ROLE_ORDER)[number];

function customerRole(role: OfferRoleCode): CustomerRole | null {
  const normalized = String(role).trim().toLowerCase();
  if (normalized === 'qualify') return 'Qualify';
  if (normalized === 'component') return 'Component';
  if (normalized === 'reward') return 'Reward';
  return null;
}

/** Resolves the roles for one offer only. Tier and unknown protocol roles stay hidden. */
export function resolveOfferRolePresentation(
  roles: readonly OfferRoleCode[] | null | undefined,
): OfferRolePresentation | null {
  const roleSet = new Set<CustomerRole>();
  for (const role of roles ?? []) {
    const known = customerRole(role);
    if (known) roleSet.add(known);
  }
  const knownRoles = ROLE_ORDER.filter((role) => roleSet.has(role));
  const key = knownRoles.join('+');

  const presentations: Record<string, Omit<OfferRolePresentation, 'roles'>> = {
    Qualify: {
      labelKey: 'OFFERS.ROLES.QUALIFY',
      iconClass: 'fa-solid fa-cart-shopping',
      tone: 'qualify',
    },
    Reward: {
      labelKey: 'OFFERS.ROLES.REWARD',
      iconClass: 'fa-solid fa-gift',
      tone: 'reward',
    },
    Component: {
      labelKey: 'OFFERS.ROLES.COMPONENT',
      iconClass: 'fa-solid fa-box-open',
      tone: 'component',
    },
    'Qualify+Reward': {
      labelKey: 'OFFERS.ROLES.QUALIFY_REWARD',
      iconClass: 'fa-solid fa-gift',
      tone: 'mixed',
    },
    'Component+Reward': {
      labelKey: 'OFFERS.ROLES.COMPONENT_REWARD',
      iconClass: 'fa-solid fa-box-open',
      tone: 'mixed',
    },
    'Qualify+Component': {
      labelKey: 'OFFERS.ROLES.QUALIFY_COMPONENT',
      iconClass: 'fa-solid fa-boxes-stacked',
      tone: 'mixed',
    },
    'Qualify+Component+Reward': {
      labelKey: 'OFFERS.ROLES.QUALIFY_COMPONENT_REWARD',
      iconClass: 'fa-solid fa-boxes-stacked',
      tone: 'mixed',
    },
  };

  const presentation = presentations[key];
  return presentation ? { ...presentation, roles: [...knownRoles] } : null;
}

function positive(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) && value > 0 ? value : null;
}

function amountCurrency(
  offer: OfferDefinition,
  selectedCurrency?: OfferCurrencyContext,
): string | null {
  if (offer.currencyCode?.trim()) return offer.currencyCode.trim();
  if (
    offer.currencyId != null &&
    selectedCurrency?.id === offer.currencyId &&
    selectedCurrency.code?.trim()
  ) {
    return selectedCurrency.code.trim();
  }
  return null;
}

/** Customer-facing summary only; it never evaluates eligibility or calculates a saving. */
export function resolveOfferBenefitPresentation(
  offer: OfferDefinition,
  selectedCurrency?: OfferCurrencyContext,
): OfferTextPresentation {
  const buy = positive(offer.qualifyingQuantity);
  const reward = positive(offer.rewardQuantity);
  const benefit = positive(offer.benefitValue);
  const spend = positive(offer.minimumSpend);
  const currency = amountCurrency(offer, selectedCurrency);

  switch (offer.typeCode || offer.bundleTypeCode) {
    case 'FixedPackage':
      return benefit && currency
        ? { key: 'OFFERS.BENEFIT.FIXED_PACKAGE', params: { amount: benefit, currency } }
        : { key: 'OFFERS.BENEFIT.FIXED_PACKAGE_NEUTRAL' };
    case 'PackagePercent':
      return benefit
        ? { key: 'OFFERS.BENEFIT.PACKAGE_PERCENT', params: { percent: benefit } }
        : { key: 'OFFERS.BENEFIT.PACKAGE_PERCENT_NEUTRAL' };
    case 'BuyXGetYSame':
      return buy && reward
        ? { key: 'OFFERS.BENEFIT.BUY_X_GET_Y_SAME', params: { buy, reward } }
        : { key: 'OFFERS.BENEFIT.REWARD_NEUTRAL' };
    case 'BuyXGetY':
      return buy && reward
        ? { key: 'OFFERS.BENEFIT.BUY_X_GET_Y', params: { buy, reward } }
        : { key: 'OFFERS.BENEFIT.REWARD_NEUTRAL' };
    case 'BuyXGetYDiscount':
      return buy && reward && benefit
        ? {
            key: 'OFFERS.BENEFIT.BUY_X_GET_Y_DISCOUNT',
            params: { buy, reward, percent: benefit },
          }
        : { key: 'OFFERS.BENEFIT.REWARD_DISCOUNT_NEUTRAL' };
    case 'MixFixed':
      return buy && benefit && currency
        ? {
            key: 'OFFERS.BENEFIT.MIX_FIXED',
            params: { quantity: buy, amount: benefit, currency },
          }
        : { key: 'OFFERS.BENEFIT.MIX_FIXED_NEUTRAL' };
    case 'MixCheapest':
      return buy && reward
        ? { key: 'OFFERS.BENEFIT.MIX_CHEAPEST', params: { quantity: buy, reward } }
        : { key: 'OFFERS.BENEFIT.MIX_CHEAPEST_NEUTRAL' };
    case 'QuantityTier':
      return { key: 'OFFERS.BENEFIT.QUANTITY_TIER' };
    case 'SpendGift':
      return spend && currency && reward
        ? {
            key: 'OFFERS.BENEFIT.SPEND_GIFT',
            params: { amount: spend, currency, reward },
          }
        : { key: 'OFFERS.BENEFIT.SPEND_GIFT_NEUTRAL' };
    default:
      return { key: 'OFFERS.BENEFIT.GENERIC' };
  }
}

export function resolveQualificationPresentation(
  offer: OfferDefinition,
): OfferTextPresentation | null {
  if (offer.qualificationModeCode === 'Pooled') {
    const quantity = positive(offer.qualifyingQuantity);
    return quantity
      ? { key: 'OFFERS.QUALIFICATION.POOLED', params: { quantity } }
      : { key: 'OFFERS.QUALIFICATION.POOLED_NEUTRAL' };
  }
  if (offer.qualificationModeCode === 'AllGroups') {
    return { key: 'OFFERS.QUALIFICATION.ALL_GROUPS' };
  }
  return null;
}

export function offerDetailsForRole(
  offer: OfferDefinition,
  role: CustomerRole | 'Tier',
): OfferDefinitionDetail[] {
  return offer.details.filter((detail) => detail.roleCode === role);
}

export function quantityTierDetails(offer: OfferDefinition): OfferDefinitionDetail[] {
  return offerDetailsForRole(offer, 'Tier')
    .filter((detail) => detail.quantity > 0 && detail.benefitValue > 0)
    .sort((a, b) => a.quantity - b.quantity);
}

export function isPackageOffer(offer: OfferDefinition): boolean {
  return ['FixedPackage', 'PackagePercent'].includes(offer.typeCode || offer.bundleTypeCode || '');
}

export function hasSeparateRewardProducts(offer: OfferDefinition): boolean {
  return ['BuyXGetYSame', 'BuyXGetY', 'BuyXGetYDiscount', 'SpendGift'].includes(
    offer.typeCode || offer.bundleTypeCode || '',
  );
}

export function hasQualifyingProducts(offer: OfferDefinition): boolean {
  return !isPackageOffer(offer) && (offer.typeCode || offer.bundleTypeCode) !== 'QuantityTier'
    ? offerDetailsForRole(offer, 'Qualify').length > 0 ||
        [
          'BuyXGetYSame',
          'BuyXGetY',
          'BuyXGetYDiscount',
          'MixFixed',
          'MixCheapest',
          'SpendGift',
        ].includes(offer.typeCode || offer.bundleTypeCode || '')
    : (offer.typeCode || offer.bundleTypeCode) === 'QuantityTier';
}
