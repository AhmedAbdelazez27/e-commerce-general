import type { EcReturnDto, PagedReturnsResult } from '../models/return.model';

type JsonRecord = Record<string, unknown>;

function readString(o: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readNumber(o: JsonRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

export function normalizeEcReturnDto(raw: unknown): EcReturnDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const o = raw as JsonRecord;
  const id = readNumber(o, 'id', 'Id');
  const returnNo = readString(o, 'returnNo', 'ReturnNo');
  const orderId = readNumber(o, 'orderId', 'OrderId');
  const orderDetailId = readNumber(o, 'orderDetailId', 'OrderDetailId');
  const productNameSnapshot = readString(o, 'productNameSnapshot', 'ProductNameSnapshot');
  const reason = readString(o, 'reason', 'Reason');
  const requestedRefundAmount = readNumber(o, 'requestedRefundAmount', 'RequestedRefundAmount');

  if (
    id == null ||
    !returnNo ||
    orderId == null ||
    orderDetailId == null ||
    !productNameSnapshot ||
    !reason ||
    requestedRefundAmount == null
  ) {
    return null;
  }

  return {
    id,
    returnNo,
    orderId,
    orderNumber: readString(o, 'orderNumber', 'OrderNumber') ?? '',
    orderDetailId,
    productVariantId: readNumber(o, 'productVariantId', 'ProductVariantId'),
    productNameSnapshot,
    variantSkuSnapshot: readString(o, 'variantSkuSnapshot', 'VariantSkuSnapshot'),
    customerId: readNumber(o, 'customerId', 'CustomerId'),
    customerName: readString(o, 'customerName', 'CustomerName'),
    reason,
    returnStatusLkpId: readNumber(o, 'returnStatusLkpId', 'ReturnStatusLkpId'),
    returnStatusNameAr: readString(o, 'returnStatusNameAr', 'ReturnStatusNameAr'),
    returnStatusNameEn: readString(o, 'returnStatusNameEn', 'ReturnStatusNameEn'),
    refundStatus: readString(o, 'refundStatus', 'RefundStatus') ?? null,
    ivReturnSaleHdId: readNumber(o, 'ivReturnSaleHdId', 'IvReturnSaleHdId') ?? null,
    refundAmount: readNumber(o, 'refundAmount', 'RefundAmount'),
    requestedRefundAmount,
    approvedDate: readString(o, 'approvedDate', 'ApprovedDate') ?? null,
    creationTime: readString(o, 'creationTime', 'CreationTime'),
    notes: readString(o, 'notes', 'Notes') ?? null,
  };
}

export function normalizePagedReturnsResult(raw: unknown): PagedReturnsResult {
  if (raw == null || typeof raw !== 'object') {
    return { totalCount: 0, items: [] };
  }

  const o = raw as JsonRecord;
  const itemsRaw = o['items'] ?? o['Items'];
  const items = Array.isArray(itemsRaw)
    ? itemsRaw
        .map((item) => normalizeEcReturnDto(item))
        .filter((item): item is EcReturnDto => item != null)
    : [];

  return {
    totalCount: readNumber(o, 'totalCount', 'TotalCount') ?? items.length,
    items,
  };
}
