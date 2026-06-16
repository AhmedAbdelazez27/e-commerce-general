import type { CartDto, CartItemDto } from '../models/cart.model';

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

  if ((cartDetailId == null || cartDetailId <= 0) && quantity <= 0) {
    return null;
  }

  return {
    CartDetailId: cartDetailId ?? undefined,
    ProductId: productId,
    ProductVariantId: productVariantId ?? undefined,
    ProductName: readString(o, 'ProductName', 'productName'),
    VariantSku: readString(o, 'VariantSku', 'variantSku'),
    Quantity: quantity,
    UnitPrice: unitPrice,
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
