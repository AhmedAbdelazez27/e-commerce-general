import type { CustomerAddressDto, PagedAddressesResult } from '../models/customer-address.model';
import type { EcOrderDto, EcOrderStatusHistoryDto } from '../models/place-order.model';
import type { ValidateCouponResultDto } from '../models/validate-coupon.model';

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
    customerName: readString(o, 'customerName', 'CustomerName'),
    addressId: readNumber(o, 'addressId', 'AddressId'),
    addressText: readString(o, 'addressText', 'AddressText'),
    orderStatus: readString(o, 'orderStatus', 'OrderStatus'),
    orderStatusLkpId: readNumber(o, 'orderStatusLkpId', 'OrderStatusLkpId'),
    orderStatusNameAr: readString(o, 'orderStatusNameAr', 'OrderStatusNameAr'),
    orderStatusNameEn: readString(o, 'orderStatusNameEn', 'OrderStatusNameEn'),
    paymentStatus: readString(o, 'paymentStatus', 'PaymentStatus'),
    paymentStatusLkpId: readNumber(o, 'paymentStatusLkpId', 'PaymentStatusLkpId'),
    paymentStatusNameAr: readString(o, 'paymentStatusNameAr', 'PaymentStatusNameAr'),
    paymentStatusNameEn: readString(o, 'paymentStatusNameEn', 'PaymentStatusNameEn'),
    shippingStatus: readString(o, 'shippingStatus', 'ShippingStatus'),
    shippingStatusLkpId: readNumber(o, 'shippingStatusLkpId', 'ShippingStatusLkpId'),
    shippingStatusNameAr: readString(o, 'shippingStatusNameAr', 'ShippingStatusNameAr'),
    shippingStatusNameEn: readString(o, 'shippingStatusNameEn', 'ShippingStatusNameEn'),
    shippingMethod: readString(o, 'shippingMethod', 'ShippingMethod'),
    paymentMethod: readString(o, 'paymentMethod', 'PaymentMethod'),
    paymentMethodLkpId: readNumber(o, 'paymentMethodLkpId', 'PaymentMethodLkpId'),
    paymentMethodNameAr: readString(o, 'paymentMethodNameAr', 'PaymentMethodNameAr'),
    paymentMethodNameEn: readString(o, 'paymentMethodNameEn', 'PaymentMethodNameEn'),
    totalAmount: readNumber(o, 'totalAmount', 'TotalAmount'),
    discountAmount: readNumber(o, 'discountAmount', 'DiscountAmount'),
    taxAmount: readNumber(o, 'taxAmount', 'TaxAmount'),
    shippingAmount: readNumber(o, 'shippingAmount', 'ShippingAmount'),
    finalAmount: readNumber(o, 'finalAmount', 'FinalAmount'),
    items: normalizeOrderItems(o['items'] ?? o['Items']),
    statusHistory: normalizeOrderStatusHistory(o['statusHistory'] ?? o['StatusHistory']),
  };
}

export function normalizeOrderStatusHistory(raw: unknown): EcOrderStatusHistoryDto[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const items: EcOrderStatusHistoryDto[] = [];

  for (const entry of raw) {
    if (entry == null || typeof entry !== 'object') {
      continue;
    }

    const o = entry as JsonRecord;
    items.push({
      id: readNumber(o, 'id', 'Id'),
      orderId: readNumber(o, 'orderId', 'OrderId'),
      statusCategory: readString(o, 'statusCategory', 'StatusCategory'),
      orderStatusLkpId: readNumber(o, 'orderStatusLkpId', 'OrderStatusLkpId'),
      orderStatusNameAr: readString(o, 'orderStatusNameAr', 'OrderStatusNameAr'),
      orderStatusNameEn: readString(o, 'orderStatusNameEn', 'OrderStatusNameEn'),
      paymentStatusLkpId: readNumber(o, 'paymentStatusLkpId', 'PaymentStatusLkpId'),
      paymentStatusNameAr: readString(o, 'paymentStatusNameAr', 'PaymentStatusNameAr'),
      paymentStatusNameEn: readString(o, 'paymentStatusNameEn', 'PaymentStatusNameEn'),
      shipmentStatusLkpId: readNumber(o, 'shipmentStatusLkpId', 'ShipmentStatusLkpId'),
      shipmentStatusNameAr: readString(o, 'shipmentStatusNameAr', 'ShipmentStatusNameAr'),
      shipmentStatusNameEn: readString(o, 'shipmentStatusNameEn', 'ShipmentStatusNameEn'),
      notesAr: readString(o, 'notesAr', 'NotesAr'),
      notesEn: readString(o, 'notesEn', 'NotesEn'),
      changedByUserId: readNumber(o, 'changedByUserId', 'ChangedByUserId'),
      changedByUserName: readString(o, 'changedByUserName', 'ChangedByUserName'),
      statusDate: readString(o, 'statusDate', 'StatusDate'),
    });
  }

  return items;
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
      productId: readNumber(o, 'productId', 'ProductId'),
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

export function normalizeValidateCouponResult(raw: unknown): ValidateCouponResultDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const o = raw as JsonRecord;
  return {
    validDate: readString(o, 'validDate', 'ValidDate') ?? '',
    isActive: readNumber(o, 'isActive', 'IsActive') ?? 0,
    usageLimit: readNumber(o, 'usageLimit', 'UsageLimit') ?? null,
    discountAmount: readNumber(o, 'discountAmount', 'DiscountAmount') ?? 0,
    validAmount: readString(o, 'validAmount', 'ValidAmount') ?? '',
    remainingAmountToBeUsed:
      readNumber(o, 'remainingAmountToBeUsed', 'RemainingAmountToBeUsed') ?? 0,
  };
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
