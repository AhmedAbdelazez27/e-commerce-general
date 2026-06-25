import type { CartDto, CartItemDto } from '../models/cart.model';
import { resolveAttachmentUrlOptional } from '../../../core/utils/attachment-url.util';

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

  const total =
    readNumber(o, 'Total', 'total') ??
    readNumber(o, 'TotalAmount', 'totalAmount');

  return {
    CartId:
      readNumber(o, 'CartId', 'cartId', 'Id', 'id') ??
      readNumber(o, 'CartHeaderId', 'cartHeaderId'),
    Items: items,
    SubTotal: readNumber(o, 'SubTotal', 'subTotal') ?? total,
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
    ProductVariantId: productVariantId ?? undefined,
    ProductName: readString(o, 'ProductName', 'productName'),
    ProductNameAr: readString(o, 'ProductNameAr', 'productNameAr'),
    ProductNameEn: readString(o, 'ProductNameEn', 'productNameEn'),
    VariantName: readString(o, 'VariantName', 'variantName'),
    VariantNameAr: readString(o, 'VariantNameAr', 'variantNameAr'),
    VariantNameEn: readString(o, 'VariantNameEn', 'variantNameEn'),
    VariantSku: readString(o, 'VariantSku', 'variantSku', 'variantSKU', 'VariantSKU'),
    ProductImageUrl: resolveAttachmentUrlOptional(
      readString(o, 'ProductImageUrl', 'productImageUrl'),
    ),
    ProductVariantImageUrl: resolveAttachmentUrlOptional(
      readString(o, 'ProductVariantImageUrl', 'productVariantImageUrl'),
    ),
    ImageUrl: resolveAttachmentUrlOptional(readString(o, 'ImageUrl', 'imageUrl')),
    Quantity: quantity,
    UnitPrice: unitPrice,
    FinalPrice: finalPrice ?? undefined,
    LineTotal:
      readNumber(o, 'LineTotal', 'lineTotal') ??
      readNumber(o, 'TotalPrice', 'totalPrice') ??
      undefined,
    DiscountAmount: readNumber(o, 'DiscountAmount', 'discountAmount'),
  };
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
      return v;
    }
  }
  return undefined;
}
