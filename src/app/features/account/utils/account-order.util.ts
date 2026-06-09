import type { EcOrderDto } from '../../checkout/models/place-order.model';

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
