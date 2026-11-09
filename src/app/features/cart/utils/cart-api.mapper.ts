import { modelId } from '../../../shared/utils/product-stock.util';
import type { CartDto, CartItemDto } from '../models/cart.model';
import { resolveProductPosterUrl } from '../../../shared/utils/storefront-media.util';
import { normalizeOfferGuidance } from '../../../shared/utils/promotion-api.mapper';

type JsonRecord = Record<string, unknown>;

/** Normalizes EcCart / ABP cart payloads (camelCase or PascalCase) into `CartDto`. */
export function normalizeCartDto(raw: unknown): CartDto {
  if (raw == null || typeof raw !== 'object') {
    return { Items: [] };
  }
  const o = raw as JsonRecord;
  const itemsRaw = o['Items'] ?? o['items'];
  const items = Array.isArray(itemsRaw)
    ? (itemsRaw.map((line) => normalizeCartItem(line)).filter(Boolean) as CartItemDto[])
    : [];

  const total = readNumber(o, 'Total', 'total') ?? readNumber(o, 'TotalAmount', 'totalAmount');
  const explicitTotal = readNumber(o, 'TotalAmount', 'totalAmount');
  const guidanceRaw = o['OfferGuidance'] ?? o['offerGuidance'];
  const supportsPromotionPricing =
    hasOwn(o, 'TotalAmount', 'totalAmount') &&
    hasOwn(o, 'ProductDiscountAmount', 'productDiscountAmount') &&
    hasOwn(o, 'BundleDiscountAmount', 'bundleDiscountAmount');

  return {
    CartId:
      readNumber(o, 'CartId', 'cartId', 'Id', 'id') ??
      readNumber(o, 'CartHeaderId', 'cartHeaderId'),
    Items: items,
    SubTotal: readNumber(o, 'SubTotal', 'subTotal'),
    Total: total,
    CouponCode: readString(o, 'CouponCode', 'couponCode', 'AppliedCouponCode', 'appliedCouponCode'),
    CouponDiscountAmount:
      readNumber(
        o,
        'CouponDiscountAmount',
        'couponDiscountAmount',
        'CouponDiscount',
        'couponDiscount',
        'TotalCouponDiscount',
        'totalCouponDiscount',
      ) ?? undefined,
    DiscountAmount:
      readNumber(
        o,
        'DiscountAmount',
        'discountAmount',
        'TotalDiscountAmount',
        'totalDiscountAmount',
        'TotalDiscount',
        'totalDiscount',
      ) ?? undefined,
    CurrencyId: readNumber(o, 'CurrencyId', 'currencyId'),
    CurrencyCode: readString(o, 'CurrencyCode', 'currencyCode'),
    CurrencyNameAr: readString(o, 'CurrencyNameAr', 'currencyNameAr'),
    CurrencyNameEn: readString(o, 'CurrencyNameEn', 'currencyNameEn'),
    TotalAmount: explicitTotal,
    ProductDiscountAmount: readNumber(o, 'ProductDiscountAmount', 'productDiscountAmount'),
    BundleDiscountAmount: readNumber(o, 'BundleDiscountAmount', 'bundleDiscountAmount'),
    AppliedBundleId: readNumber(o, 'AppliedBundleId', 'appliedBundleId'),
    AppliedBundleCode: readString(o, 'AppliedBundleCode', 'appliedBundleCode'),
    AppliedBundleNameAr: readString(o, 'AppliedBundleNameAr', 'appliedBundleNameAr'),
    AppliedBundleNameEn: readString(o, 'AppliedBundleNameEn', 'appliedBundleNameEn'),
    AppliedBundleApplications: readNumber(
      o,
      'AppliedBundleApplications',
      'appliedBundleApplications',
    ),
    PromotionWarnings: readStringArray(o, 'PromotionWarnings', 'promotionWarnings'),
    TaxAmount: readNumber(o, 'TaxAmount', 'taxAmount'),
    ItemsCount: readNumber(o, 'ItemsCount', 'itemsCount'),
    OfferGuidance: Array.isArray(guidanceRaw)
      ? guidanceRaw
          .map(normalizeOfferGuidance)
          .filter((item): item is NonNullable<CartDto['OfferGuidance']>[number] => item != null)
      : [],
    SupportsPromotionPricing: supportsPromotionPricing,
  };
}

function normalizeCartItem(raw: unknown): CartItemDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }
  const o = raw as JsonRecord;
  const cartDetailId = readNumber(o, 'CartDetailId', 'id');
  const productId = readNumber(o, 'ProductId', 'productId') ?? 0;
  const productVariantId = readNumber(o, 'ProductVariantId', 'productVariantId');
  const quantity = readNumber(o, 'Quantity', 'quantity') ?? 0;
  const unitPrice = readNumber(o, 'UnitPrice', 'unitPrice') ?? 0;
  const finalPrice = readNumber(o, 'FinalPrice', 'finalPrice');

  if ((cartDetailId == null || cartDetailId <= 0) && quantity <= 0) {
    return null;
  }

  return {
    CartDetailId: cartDetailId ?? undefined,
    ProductId: productId,
    ProductVariantId: modelId(productVariantId),
    ProductName: readString(o, 'ProductName', 'productName'),
    ProductNameAr: readString(o, 'ProductNameAr', 'productNameAr'),
    ProductNameEn: readString(o, 'ProductNameEn', 'productNameEn'),
    VariantName: readString(o, 'VariantName', 'variantName'),
    VariantNameAr: readString(o, 'VariantNameAr', 'variantNameAr'),
    VariantNameEn: readString(o, 'VariantNameEn', 'variantNameEn'),
    VariantSku: readString(o, 'VariantSku', 'variantSku', 'variantSKU', 'VariantSKU'),
    ProductImageUrl: resolveProductPosterUrl(readString(o, 'ProductImageUrl', 'productImageUrl')),
    ProductVariantImageUrl: resolveProductPosterUrl(
      readString(o, 'ProductVariantImageUrl', 'productVariantImageUrl'),
    ),
    ImageUrl: resolveProductPosterUrl(readString(o, 'ImageUrl', 'imageUrl')),
    HasModel3D: readBool(o, 'HasModel3D', 'hasModel3D', 'has3D', 'Has3D'),
    Quantity: quantity,
    UnitPrice: unitPrice,
    FinalPrice: finalPrice ?? undefined,
    LineTotal:
      readNumber(o, 'LineTotal', 'lineTotal') ??
      readNumber(o, 'TotalPrice', 'totalPrice') ??
      undefined,
    DiscountAmount: readNumber(o, 'DiscountAmount', 'discountAmount'),
    SelectedReward: readBool(o, 'SelectedReward', 'selectedReward'),
    ProductDiscountTotal: readNumber(o, 'ProductDiscountTotal', 'productDiscountTotal'),
    BundleDiscountTotal: readNumber(o, 'BundleDiscountTotal', 'bundleDiscountTotal'),
    CouponDiscountTotal: readNumber(o, 'CouponDiscountTotal', 'couponDiscountTotal'),
    BundleUsedQuantity: readNumber(o, 'BundleUsedQuantity', 'bundleUsedQuantity'),
    RewardQuantity: readNumber(o, 'RewardQuantity', 'rewardQuantity'),
  };
}

function hasOwn(o: JsonRecord, ...keys: string[]): boolean {
  return keys.some((key) => Object.prototype.hasOwnProperty.call(o, key));
}

function readNumber(o: JsonRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === 'number' && Number.isFinite(v)) {
      return v;
    }
  }
  return undefined;
}

function readString(o: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === 'string' && v.trim()) {
      return v.trim();
    }
  }
  return undefined;
}

function readStringArray(o: JsonRecord, ...keys: string[]): string[] {
  for (const key of keys) {
    const v = o[key];
    if (Array.isArray(v)) {
      return v.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
  }
  return [];
}

function readBool(o: JsonRecord, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === 'boolean') {
      return v;
    }
  }
  return undefined;
}
