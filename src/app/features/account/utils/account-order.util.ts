import type { EcOrderDto, EcOrderStatusHistoryDto } from '../../checkout/models/place-order.model';

export type OrderListFilter = 'active' | 'all';

export interface OrderTrackingStep {
  id: string;
  labelKey: string;
  done: boolean;
  current: boolean;
}

const TERMINAL_STATUSES = new Set([
  'completed',
  'delivered',
  'cancelled',
  'canceled',
  'refunded',
  'closed',
]);

const STATUS_LABEL_KEYS: Record<string, string> = {
  pending: 'ORDERS.STATUS_PENDING',
  processing: 'ORDERS.STATUS_PROCESSING',
  confirmed: 'ORDERS.STATUS_PROCESSING',
  paid: 'ORDERS.STATUS_PAID',
  unpaid: 'ORDERS.STATUS_UNPAID',
  shipped: 'ORDERS.STATUS_SHIPPED',
  delivering: 'ORDERS.STATUS_SHIPPED',
  delivered: 'ORDERS.STATUS_DELIVERED',
  completed: 'ORDERS.STATUS_DELIVERED',
  cancelled: 'ORDERS.STATUS_CANCELLED',
  canceled: 'ORDERS.STATUS_CANCELLED',
  refunded: 'ORDERS.STATUS_REFUNDED',
};

export function normalizeStatusToken(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

export function isActiveOrder(order: EcOrderDto): boolean {
  const tokens = [order.orderStatus, order.shippingStatus, order.paymentStatus].map(normalizeStatusToken);

  if (tokens.some((status) => ['cancelled', 'canceled', 'refunded'].includes(status))) {
    return false;
  }

  if (tokens.some((status) => ['delivered', 'completed', 'closed'].includes(status))) {
    return false;
  }

  return true;
}

export function orderStatusLabelKey(value: string | null | undefined): string | null {
  const token = normalizeStatusToken(value);
  return token ? (STATUS_LABEL_KEYS[token] ?? null) : null;
}

export function orderTrackingSteps(order: EcOrderDto): OrderTrackingStep[] {
  const orderStatus = normalizeStatusToken(order.orderStatus);
  const shippingStatus = normalizeStatusToken(order.shippingStatus);
  const combined = [orderStatus, shippingStatus].filter(Boolean);

  const isCancelled = combined.some((status) => ['cancelled', 'canceled', 'refunded'].includes(status));
  const isDelivered = combined.some((status) => ['delivered', 'completed', 'closed'].includes(status));
  const isShipped = combined.some((status) => ['shipped', 'delivering', 'outfordelivery'].includes(status));
  const isProcessing = combined.some((status) =>
    ['processing', 'confirmed', 'paid', 'preparing'].includes(status),
  );

  let currentIndex = 0;
  if (isCancelled) {
    currentIndex = 0;
  } else if (isDelivered) {
    currentIndex = 3;
  } else if (isShipped) {
    currentIndex = 2;
  } else if (isProcessing) {
    currentIndex = 1;
  }

  const steps: OrderTrackingStep[] = [
    { id: 'placed', labelKey: 'ORDERS.STEP_PLACED', done: false, current: false },
    { id: 'processing', labelKey: 'ORDERS.STEP_PROCESSING', done: false, current: false },
    { id: 'shipped', labelKey: 'ORDERS.STEP_SHIPPED', done: false, current: false },
    { id: 'delivered', labelKey: 'ORDERS.STEP_DELIVERED', done: false, current: false },
  ];

  return steps.map((step, index) => ({
    ...step,
    done: !isCancelled && index < currentIndex,
    current: !isCancelled && index === currentIndex,
  }));
}

export function lineItemName(item: NonNullable<EcOrderDto['items']>[number]): string {
  return item.productName ?? item.productNameSnapshot ?? item.variantSku ?? item.variantSkuSnapshot ?? '—';
}

export function lineItemTotal(item: NonNullable<EcOrderDto['items']>[number]): number {
  return item.lineTotal ?? item.total ?? (item.unitPrice ?? 0) * (item.quantity ?? 0);
}

export function canLinkOrderItemToProduct(
  item: NonNullable<EcOrderDto['items']>[number],
): boolean {
  return (item.productId ?? 0) > 0;
}

export function orderItemProductLink(
  item: NonNullable<EcOrderDto['items']>[number],
): string[] | null {
  const productId = item.productId ?? 0;
  if (productId <= 0) {
    return null;
  }
  return ['/shop', String(productId)];
}

export function localizedBilingualLabel(
  nameAr: string | null | undefined,
  nameEn: string | null | undefined,
  fallback: string | null | undefined,
  isArabic: boolean,
): string {
  const ar = nameAr?.trim();
  const en = nameEn?.trim();
  const fb = fallback?.trim();
  return (isArabic ? ar : en) || fb || '—';
}

export function orderPaymentMethodLabel(order: EcOrderDto, isArabic: boolean): string {
  return localizedBilingualLabel(
    order.paymentMethodNameAr,
    order.paymentMethodNameEn,
    order.paymentMethod,
    isArabic,
  );
}

export function orderStatusDisplayName(
  order: EcOrderDto,
  kind: 'order' | 'payment' | 'shipping',
  isArabic: boolean,
): string {
  if (kind === 'order') {
    return localizedBilingualLabel(
      order.orderStatusNameAr,
      order.orderStatusNameEn,
      order.orderStatus,
      isArabic,
    );
  }
  if (kind === 'payment') {
    return localizedBilingualLabel(
      order.paymentStatusNameAr,
      order.paymentStatusNameEn,
      order.paymentStatus,
      isArabic,
    );
  }
  return localizedBilingualLabel(
    order.shippingStatusNameAr,
    order.shippingStatusNameEn,
    order.shippingStatus,
    isArabic,
  );
}

export function statusHistoryPrimaryLabel(entry: EcOrderStatusHistoryDto, isArabic: boolean): string {
  const orderName = localizedBilingualLabel(
    entry.orderStatusNameAr,
    entry.orderStatusNameEn,
    undefined,
    isArabic,
  );
  const paymentName = localizedBilingualLabel(
    entry.paymentStatusNameAr,
    entry.paymentStatusNameEn,
    undefined,
    isArabic,
  );
  const shipmentName = localizedBilingualLabel(
    entry.shipmentStatusNameAr,
    entry.shipmentStatusNameEn,
    undefined,
    isArabic,
  );

  const category = normalizeStatusToken(entry.statusCategory);
  const parts: string[] = [];

  if (category.includes('order') && orderName !== '—') {
    parts.push(orderName);
  }
  if (category.includes('payment') && paymentName !== '—') {
    parts.push(paymentName);
  }
  if ((category.includes('ship') || category.includes('shipping')) && shipmentName !== '—') {
    parts.push(shipmentName);
  }

  if (parts.length === 0) {
    for (const name of [orderName, paymentName, shipmentName]) {
      if (name !== '—') {
        parts.push(name);
      }
    }
  }

  return parts.length ? parts.join(' · ') : '—';
}

export function statusHistoryNotes(entry: EcOrderStatusHistoryDto, isArabic: boolean): string | null {
  const notes = localizedBilingualLabel(entry.notesAr, entry.notesEn, undefined, isArabic);
  return notes === '—' ? null : notes;
}

export function sortStatusHistory(entries: EcOrderStatusHistoryDto[]): EcOrderStatusHistoryDto[] {
  return [...entries].sort((a, b) => {
    const aTime = Date.parse(a.statusDate ?? '');
    const bTime = Date.parse(b.statusDate ?? '');
    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
      return bTime - aTime;
    }
    return (b.id ?? 0) - (a.id ?? 0);
  });
}
