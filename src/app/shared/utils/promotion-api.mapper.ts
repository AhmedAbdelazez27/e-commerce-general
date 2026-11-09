import { modelId, normalizeStock, canPurchase } from './product-stock.util';
import {
  OfferDefinition,
  OfferDefinitionDetail,
  OfferGuidance,
  OfferGuidanceRequirement,
  OfferLookupValue,
  OfferLookups,
  OfferProduct,
  OfferRewardCandidate,
  PagedResult,
  PublicOfferBadge,
} from '../models/promotion.model';

type JsonRecord = Record<string, unknown>;

function record(raw: unknown): JsonRecord | null {
  return raw != null && typeof raw === 'object' ? (raw as JsonRecord) : null;
}

function value(o: JsonRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(o, key)) {
      return o[key];
    }
  }
  return undefined;
}

function numberValue(o: JsonRecord, ...keys: string[]): number | undefined {
  const raw = value(o, ...keys);
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  return undefined;
}

function stringValue(o: JsonRecord, ...keys: string[]): string | undefined {
  const raw = value(o, ...keys);
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

function boolValue(o: JsonRecord, ...keys: string[]): boolean {
  const raw = value(o, ...keys);
  return typeof raw === 'boolean' ? raw : false;
}

function stringArray(o: JsonRecord, ...keys: string[]): string[] {
  const raw = value(o, ...keys);
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : [];
}

function numberArray(o: JsonRecord, ...keys: string[]): number[] {
  const raw = value(o, ...keys);
  return Array.isArray(raw)
    ? raw.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
    : [];
}

export function normalizePublicOfferBadge(raw: unknown): PublicOfferBadge | null {
  const o = record(raw);
  if (!o) return null;
  const offerId = numberValue(o, 'offerId', 'OfferId');
  if (offerId == null || offerId <= 0) return null;
  return {
    offerId,
    code: stringValue(o, 'code', 'Code') ?? '',
    nameAr: stringValue(o, 'nameAr', 'NameAr') ?? '',
    nameEn: stringValue(o, 'nameEn', 'NameEn') ?? '',
    typeCode: stringValue(o, 'typeCode', 'TypeCode') ?? '',
    roles: stringArray(o, 'roles', 'Roles'),
    detailIds: numberArray(o, 'detailIds', 'DetailIds'),
    matchingVariantIds: numberArray(o, 'matchingVariantIds', 'MatchingVariantIds'),
    appliesToAllVariants: boolValue(o, 'appliesToAllVariants', 'AppliesToAllVariants'),
    requiresCartEvaluation: boolValue(o, 'requiresCartEvaluation', 'RequiresCartEvaluation'),
  };
}

export function normalizeOfferBadges(raw: unknown): PublicOfferBadge[] {
  return Array.isArray(raw)
    ? raw.map(normalizePublicOfferBadge).filter((item): item is PublicOfferBadge => item != null)
    : [];
}

function normalizeOfferDetail(raw: unknown): OfferDefinitionDetail | null {
  const o = record(raw);
  if (!o) return null;
  const id = numberValue(o, 'id', 'Id');
  if (id == null || id <= 0) return null;
  return {
    id,
    roleLkpId: numberValue(o, 'roleLkpId', 'RoleLkpId'),
    roleCode: stringValue(o, 'roleCode', 'RoleCode') ?? '',
    roleNameAr: stringValue(o, 'roleNameAr', 'RoleNameAr'),
    roleNameEn: stringValue(o, 'roleNameEn', 'RoleNameEn'),
    targetTypeLkpId: numberValue(o, 'targetTypeLkpId', 'TargetTypeLkpId'),
    targetTypeCode: stringValue(o, 'targetTypeCode', 'TargetTypeCode') ?? '',
    targetTypeNameAr: stringValue(o, 'targetTypeNameAr', 'TargetTypeNameAr'),
    targetTypeNameEn: stringValue(o, 'targetTypeNameEn', 'TargetTypeNameEn'),
    targetId: numberValue(o, 'targetId', 'TargetId') ?? null,
    targetName: stringValue(o, 'targetName', 'TargetName'),
    targetNameAr: stringValue(o, 'targetNameAr', 'TargetNameAr'),
    targetNameEn: stringValue(o, 'targetNameEn', 'TargetNameEn'),
    includeSubcategories: boolValue(o, 'includeSubcategories', 'IncludeSubcategories'),
    quantity: numberValue(o, 'quantity', 'Quantity') ?? 0,
    benefitValue: numberValue(o, 'benefitValue', 'BenefitValue') ?? 0,
  };
}

export function normalizeOfferDefinition(raw: unknown): OfferDefinition | null {
  const o = record(raw);
  if (!o) return null;
  const id = numberValue(o, 'id', 'Id');
  if (id == null || id <= 0) return null;
  const detailsRaw = value(o, 'details', 'Details');
  return {
    id,
    code: stringValue(o, 'code', 'Code') ?? '',
    nameAr: stringValue(o, 'nameAr', 'NameAr') ?? '',
    nameEn: stringValue(o, 'nameEn', 'NameEn') ?? '',
    descriptionAr: stringValue(o, 'descriptionAr', 'DescriptionAr'),
    descriptionEn: stringValue(o, 'descriptionEn', 'DescriptionEn'),
    typeCode: stringValue(o, 'typeCode', 'TypeCode', 'bundleTypeCode', 'BundleTypeCode') ?? '',
    bundleTypeCode: stringValue(o, 'bundleTypeCode', 'BundleTypeCode'),
    startDate: stringValue(o, 'startDate', 'StartDate'),
    endDate: stringValue(o, 'endDate', 'EndDate'),
    priority: numberValue(o, 'priority', 'Priority') ?? 0,
    qualifyingQuantity: numberValue(o, 'qualifyingQuantity', 'QualifyingQuantity') ?? 0,
    rewardQuantity: numberValue(o, 'rewardQuantity', 'RewardQuantity') ?? 0,
    minimumSpend: numberValue(o, 'minimumSpend', 'MinimumSpend') ?? 0,
    benefitValue: numberValue(o, 'benefitValue', 'BenefitValue') ?? 0,
    currencyId: numberValue(o, 'currencyId', 'CurrencyId') ?? null,
    currencyCode: stringValue(o, 'currencyCode', 'CurrencyCode'),
    repeatPolicyCode: stringValue(o, 'repeatPolicyCode', 'RepeatPolicyCode'),
    maxApplications: numberValue(o, 'maxApplications', 'MaxApplications') ?? null,
    combinationPolicyCode: stringValue(o, 'combinationPolicyCode', 'CombinationPolicyCode'),
    qualificationModeCode: stringValue(o, 'qualificationModeCode', 'QualificationModeCode'),
    rewardSelectionCode: stringValue(o, 'rewardSelectionCode', 'RewardSelectionCode'),
    unavailableRewardCode: stringValue(o, 'unavailableRewardCode', 'UnavailableRewardCode'),
    rowVersion: stringValue(o, 'rowVersion', 'RowVersion'),
    details: Array.isArray(detailsRaw)
      ? detailsRaw
          .map(normalizeOfferDetail)
          .filter((item): item is OfferDefinitionDetail => item != null)
      : [],
  };
}

export function normalizePagedResult<T>(
  raw: unknown,
  normalizeItem: (value: unknown) => T | null,
): PagedResult<T> {
  const o = record(raw);
  const itemsRaw = o ? value(o, 'items', 'Items') : undefined;
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map(normalizeItem).filter((item): item is T => item != null)
    : [];
  return { totalCount: (o && numberValue(o, 'totalCount', 'TotalCount')) ?? items.length, items };
}

export function normalizeOfferProduct(raw: unknown): OfferProduct | null {
  const o = record(raw);
  if (!o) return null;
  const productId = numberValue(o, 'productId', 'ProductId');
  const productVariantId = numberValue(o, 'productVariantId', 'ProductVariantId');
  if (!productId) return null;
  return {
    productId,
    productVariantId: modelId(productVariantId),
    stock: normalizeStock(value(o, 'stock', 'Stock')),
    productNameAr: stringValue(o, 'productNameAr', 'ProductNameAr') ?? '',
    productNameEn: stringValue(o, 'productNameEn', 'ProductNameEn') ?? '',
    variantName: stringValue(o, 'variantName', 'VariantName'),
    variantSku: stringValue(o, 'variantSku', 'VariantSku', 'VariantSKU'),
    imageUrl: stringValue(o, 'imageUrl', 'ImageUrl'),
    availableQuantity: numberValue(o, 'availableQuantity', 'AvailableQuantity') ?? 0,
    isAvailable: canPurchase(
      normalizeStock(value(o, 'stock', 'Stock')),
      numberValue(o, 'availableQuantity', 'AvailableQuantity')! > 0 ? 'InStock' : undefined,
    ),
    roles: stringArray(o, 'roles', 'Roles'),
    detailIds: numberArray(o, 'detailIds', 'DetailIds'),
  };
}

function normalizeGuidanceRequirement(raw: unknown): OfferGuidanceRequirement | null {
  const o = record(raw);
  if (!o) return null;
  return {
    detailId: numberValue(o, 'detailId', 'DetailId') ?? null,
    roleCode: stringValue(o, 'roleCode', 'RoleCode') ?? '',
    requiredQuantity: numberValue(o, 'requiredQuantity', 'RequiredQuantity') ?? 0,
    matchingQuantity: numberValue(o, 'matchingQuantity', 'MatchingQuantity') ?? 0,
    missingQuantity: numberValue(o, 'missingQuantity', 'MissingQuantity') ?? 0,
    matchingVariantIds: numberArray(o, 'matchingVariantIds', 'MatchingVariantIds'),
  };
}

export function normalizeOfferGuidance(raw: unknown): OfferGuidance | null {
  const o = record(raw);
  if (!o) return null;
  const offerId = numberValue(o, 'offerId', 'OfferId');
  if (!offerId) return null;
  const requirementsRaw = value(o, 'requirements', 'Requirements');
  return {
    offerId,
    code: stringValue(o, 'code', 'Code') ?? '',
    nameAr: stringValue(o, 'nameAr', 'NameAr') ?? '',
    nameEn: stringValue(o, 'nameEn', 'NameEn') ?? '',
    typeCode: stringValue(o, 'typeCode', 'TypeCode') ?? '',
    statusCode: stringValue(o, 'statusCode', 'StatusCode') ?? '',
    rewardSelectionCode: stringValue(o, 'rewardSelectionCode', 'RewardSelectionCode'),
    isEligible: boolValue(o, 'isEligible', 'IsEligible'),
    isApplied: boolValue(o, 'isApplied', 'IsApplied'),
    applications: numberValue(o, 'applications', 'Applications') ?? 0,
    progressApplication: numberValue(o, 'progressApplication', 'ProgressApplication') ?? 0,
    rewardMissing: boolValue(o, 'rewardMissing', 'RewardMissing'),
    blocksCheckout: boolValue(o, 'blocksCheckout', 'BlocksCheckout'),
    requiresRewardSelection: boolValue(o, 'requiresRewardSelection', 'RequiresRewardSelection'),
    rewardCandidateVariantIdsInCart: numberArray(
      o,
      'rewardCandidateVariantIdsInCart',
      'RewardCandidateVariantIdsInCart',
    ),
    missingQuantity: numberValue(o, 'missingQuantity', 'MissingQuantity') ?? 0,
    qualifyingSpend: numberValue(o, 'qualifyingSpend', 'QualifyingSpend'),
    requiredSpend: numberValue(o, 'requiredSpend', 'RequiredSpend'),
    missingSpend: numberValue(o, 'missingSpend', 'MissingSpend'),
    nextTierQuantity: numberValue(o, 'nextTierQuantity', 'NextTierQuantity'),
    nextTierPercent: numberValue(o, 'nextTierPercent', 'NextTierPercent'),
    missingQuantityForNextTier: numberValue(
      o,
      'missingQuantityForNextTier',
      'MissingQuantityForNextTier',
    ),
    requirements: Array.isArray(requirementsRaw)
      ? requirementsRaw
          .map(normalizeGuidanceRequirement)
          .filter((item): item is OfferGuidanceRequirement => item != null)
      : [],
  };
}

export function normalizeOfferRewardCandidate(raw: unknown): OfferRewardCandidate | null {
  const o = record(raw);
  if (!o) return null;
  const product = normalizeOfferProduct(value(o, 'product', 'Product'));
  if (!product) return null;
  return {
    product,
    additionalQuantity: numberValue(o, 'additionalQuantity', 'AdditionalQuantity') ?? 0,
    markSelectedReward: boolValue(o, 'markSelectedReward', 'MarkSelectedReward'),
    hasSufficientStock: boolValue(o, 'hasSufficientStock', 'HasSufficientStock'),
    statusCode: stringValue(o, 'statusCode', 'StatusCode') ?? '',
    offerEligibleAfterChange: boolValue(o, 'offerEligibleAfterChange', 'OfferEligibleAfterChange'),
    offerAppliedAfterChange: boolValue(o, 'offerAppliedAfterChange', 'OfferAppliedAfterChange'),
    previewTotal: numberValue(o, 'previewTotal', 'PreviewTotal'),
    previewOfferSavings: numberValue(o, 'previewOfferSavings', 'PreviewOfferSavings'),
    currencyId: numberValue(o, 'currencyId', 'CurrencyId'),
  };
}

export function normalizeOfferLookups(raw: unknown): OfferLookups {
  const o = record(raw);
  if (!o) return {};
  const result: OfferLookups = {};
  for (const [family, rawValues] of Object.entries(o)) {
    if (!Array.isArray(rawValues)) continue;
    result[family] = rawValues
      .map((entry): OfferLookupValue | null => {
        const item = record(entry);
        if (!item) return null;
        const id = numberValue(item, 'id', 'Id');
        if (!id) return null;
        return {
          id,
          code: stringValue(item, 'code', 'Code') ?? '',
          nameAr: stringValue(item, 'nameAr', 'NameAr') ?? '',
          nameEn: stringValue(item, 'nameEn', 'NameEn') ?? '',
          isActive: boolValue(item, 'isActive', 'IsActive'),
        };
      })
      .filter((item): item is OfferLookupValue => item != null);
  }
  return result;
}
