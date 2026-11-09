import type { ProductStock } from './product-stock.model';
export type OfferRoleCode = 'Qualify' | 'Reward' | 'Component' | 'Tier' | string;

export interface PublicOfferBadge {
  offerId: number;
  code: string;
  nameAr: string;
  nameEn: string;
  typeCode: string;
  roles: OfferRoleCode[];
  detailIds: number[];
  matchingVariantIds: number[];
  appliesToAllVariants: boolean;
  requiresCartEvaluation: boolean;
}

export interface OfferLookupValue {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
}

export type OfferLookups = Record<string, OfferLookupValue[]>;

export interface OfferDefinitionDetail {
  id: number;
  roleLkpId?: number;
  roleCode: string;
  roleNameAr?: string;
  roleNameEn?: string;
  targetTypeLkpId?: number;
  targetTypeCode: string;
  targetTypeNameAr?: string;
  targetTypeNameEn?: string;
  targetId?: number | null;
  targetName?: string;
  targetNameAr?: string;
  targetNameEn?: string;
  includeSubcategories: boolean;
  quantity: number;
  benefitValue: number;
}

export interface OfferDefinition {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  typeCode: string;
  bundleTypeCode?: string;
  startDate?: string;
  endDate?: string;
  priority: number;
  qualifyingQuantity: number;
  rewardQuantity: number;
  minimumSpend: number;
  benefitValue: number;
  currencyId?: number | null;
  currencyCode?: string;
  repeatPolicyCode?: string;
  maxApplications?: number | null;
  combinationPolicyCode?: string;
  qualificationModeCode?: string;
  rewardSelectionCode?: string;
  unavailableRewardCode?: string;
  rowVersion?: string;
  details: OfferDefinitionDetail[];
}

export interface OfferProduct {
  stock?: ProductStock;
  productId: number;
  productVariantId: number | null;
  productNameAr: string;
  productNameEn: string;
  variantName?: string;
  variantSku?: string;
  imageUrl?: string;
  availableQuantity: number;
  isAvailable: boolean;
  roles: OfferRoleCode[];
  detailIds: number[];
}

export interface OfferGuidanceRequirement {
  detailId?: number | null;
  roleCode: string;
  requiredQuantity: number;
  matchingQuantity: number;
  missingQuantity: number;
  matchingVariantIds: number[];
}

export interface OfferGuidance {
  offerId: number;
  code: string;
  nameAr: string;
  nameEn: string;
  typeCode: string;
  statusCode: string;
  rewardSelectionCode?: string;
  isEligible: boolean;
  isApplied: boolean;
  applications: number;
  progressApplication: number;
  rewardMissing: boolean;
  blocksCheckout: boolean;
  requiresRewardSelection: boolean;
  rewardCandidateVariantIdsInCart: number[];
  missingQuantity: number;
  qualifyingSpend?: number;
  requiredSpend?: number;
  missingSpend?: number;
  nextTierQuantity?: number;
  nextTierPercent?: number;
  missingQuantityForNextTier?: number;
  requirements: OfferGuidanceRequirement[];
}

export interface OfferRewardCandidate {
  product: OfferProduct;
  additionalQuantity: number;
  markSelectedReward: boolean;
  hasSufficientStock: boolean;
  statusCode: string;
  offerEligibleAfterChange: boolean;
  offerAppliedAfterChange: boolean;
  previewTotal?: number;
  previewOfferSavings?: number;
  currencyId?: number;
}

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}

export interface ApplyOfferSelectionItem {
  productId: number;
  productVariantId: number | null;
  quantity: number;
  selectedReward: boolean;
}

export interface ApplyOfferSelectionRequest {
  offerId: number;
  offerRowVersion: string;
  customerId?: number;
  currencyId?: number;
  currencyCode?: string;
  couponCode?: string | null;
  clearOtherRewards: boolean;
  items: ApplyOfferSelectionItem[];
}

export interface ProductOffers {
  productId: number;
  productVariantId: number | null;
  offers: PublicOfferBadge[];
}
