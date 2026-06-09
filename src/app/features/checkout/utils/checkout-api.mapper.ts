import type { CustomerAddressDto, PagedAddressesResult } from '../models/customer-address.model';
import type { EcOrderDto } from '../models/place-order.model';

type JsonRecord = Record<string, unknown>;

export function normalizePagedAddresses(raw: unknown): PagedAddressesResult {
  if (raw == null || typeof raw !== 'object') {
    return { items: [], totalCount: 0 };
  }
  const o = raw as JsonRecord;
  const itemsRaw = o['items'] ?? o['Items'];
  const items = Array.isArray(itemsRaw)
    ? (itemsRaw.map(normalizeAddress).filter(Boolean) as CustomerAddressDto[])
    : [];
  const totalCount = readNumber(o, 'totalCount', 'TotalCount') ?? items.length;
  return { items, totalCount };
}

export function normalizeAddress(raw: unknown): CustomerAddressDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }
  const o = raw as JsonRecord;
  const id = readNumber(o, 'id', 'Id');
  if (id == null || id <= 0) {
    return null;
  }
  return {
    id,
    customerId: readNumber(o, 'customerId', 'CustomerId'),
    countryId: readNumber(o, 'countryId', 'CountryId') ?? 1,
    city: readString(o, 'city', 'City') ?? '',
    area: readString(o, 'area', 'Area') ?? '',
    street: readString(o, 'street', 'Street') ?? '',
    building: readString(o, 'building', 'Building') ?? '',
    latitude: readNumber(o, 'latitude', 'Latitude') ?? null,
    longitude: readNumber(o, 'longitude', 'Longitude') ?? null,
    isDefault: readBool(o, 'isDefault', 'IsDefault') ?? false,
  };
}

export function normalizeOrder(raw: unknown): EcOrderDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }
  const o = raw as JsonRecord;
  const id = readNumber(o, 'id', 'Id') ?? 0;
  const orderNumber = readString(o, 'orderNumber', 'OrderNumber') ?? '';
  if (!orderNumber && id <= 0) {
    return null;
  }
  return {
    id,
    orderNumber,
    customerId: readNumber(o, 'customerId', 'CustomerId'),
    orderStatus: readString(o, 'orderStatus', 'OrderStatus'),
    paymentStatus: readString(o, 'paymentStatus', 'PaymentStatus'),
    shippingStatus: readString(o, 'shippingStatus', 'ShippingStatus'),
    totalAmount: readNumber(o, 'totalAmount', 'TotalAmount'),
    discountAmount: readNumber(o, 'discountAmount', 'DiscountAmount'),
    taxAmount: readNumber(o, 'taxAmount', 'TaxAmount'),
    shippingAmount: readNumber(o, 'shippingAmount', 'ShippingAmount'),
    finalAmount: readNumber(o, 'finalAmount', 'FinalAmount'),
    items: normalizeOrderItems(o['items'] ?? o['Items']),
  };
}

function normalizeOrderItems(raw: unknown): EcOrderDto['items'] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((line) => {
    if (line == null || typeof line !== 'object') {
      return {};
    }
    const o = line as JsonRecord;
    return {
      id: readNumber(o, 'id', 'Id'),
      productVariantId: readNumber(o, 'productVariantId', 'ProductVariantId'),
      productName:
        readString(o, 'productName', 'ProductName') ??
        readString(o, 'productNameSnapshot', 'ProductNameSnapshot'),
      productNameSnapshot: readString(o, 'productNameSnapshot', 'ProductNameSnapshot'),
      variantSku:
        readString(o, 'variantSku', 'VariantSku') ??
        readString(o, 'variantSkuSnapshot', 'VariantSkuSnapshot'),
      variantSkuSnapshot: readString(o, 'variantSkuSnapshot', 'VariantSkuSnapshot'),
      specificationSummary: readString(o, 'specificationSummary', 'SpecificationSummary'),
      quantity: readNumber(o, 'quantity', 'Quantity'),
      unitPrice: readNumber(o, 'unitPrice', 'UnitPrice'),
      discount: readNumber(o, 'discount', 'Discount'),
      tax: readNumber(o, 'tax', 'Tax'),
      lineTotal:
        readNumber(o, 'lineTotal', 'LineTotal') ??
        readNumber(o, 'total', 'Total') ??
        readNumber(o, 'totalPrice', 'TotalPrice'),
      total: readNumber(o, 'total', 'Total'),
    };
  });
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
    if (typeof v === 'string') {
      return v;
    }
  }
  return undefined;
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

export function formatAddressLines(
  address: Pick<CustomerAddressDto, 'city' | 'area' | 'street' | 'building'>,
): string[] {
  const lines: string[] = [];
  const streetLine = [address.street, address.building].filter(Boolean).join(', ');
  if (streetLine) {
    lines.push(streetLine);
  }
  const cityLine = [address.area, address.city].filter(Boolean).join(', ');
  if (cityLine) {
    lines.push(cityLine);
  }
  return lines;
}
