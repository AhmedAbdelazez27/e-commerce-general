import type { AvailabilityStatus, ProductStock } from '../models/product-stock.model';

export function modelId(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function selectionKey(productId: number, productVariantId?: number | null): string {
  return `${productId}:${modelId(productVariantId) ?? 'item'}`;
}

export function requiresModel(stock?: ProductStock): boolean {
  return stock?.controlType === 2 && stock.lotType === 2;
}

export function canPurchase(stock?: ProductStock, legacyStatus?: string): boolean {
  if (!stock) return legacyStatus === 'InStock';
  return stock.available > 0 || stock.allowOnlineBackorder === true;
}

export function stockStatus(stock?: ProductStock, legacyStatus?: string): AvailabilityStatus {
  if (!stock) return legacyStatus === 'InStock' ? 'InStock' : 'OutOfStock';
  return stock.available > 0
    ? 'InStock'
    : stock.allowOnlineBackorder === true
      ? 'Backorder'
      : 'OutOfStock';
}

export function validQuantity(quantity: number, stock?: ProductStock): boolean {
  return (
    Number.isFinite(quantity) &&
    quantity > 0 &&
    Math.abs(quantity * 100 - Math.round(quantity * 100)) < 1e-7 &&
    (stock?.controlType !== 1 || Number.isInteger(quantity))
  );
}

export function normalizeStock(raw: unknown): ProductStock | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const value = (key: string) => o[key] ?? o[key[0].toUpperCase() + key.slice(1)];
  const available = value('available');
  const controlType = value('controlType');
  if (
    typeof available !== 'number' ||
    !Number.isFinite(available) ||
    typeof controlType !== 'number'
  )
    return undefined;
  return {
    available,
    controlType,
    lotType: value('lotType') as number | null | undefined,
    onHand: value('onHand') as number | undefined,
    reserved: value('reserved') as number | undefined,
    warehouseAvailable: value('warehouseAvailable') as number | null | undefined,
    allowOnlineBackorder: value('allowOnlineBackorder') === true,
    maxBackorderQuantity: value('maxBackorderQuantity') as number | null | undefined,
    expectedAvailabilityDate: value('expectedAvailabilityDate') as string | null | undefined,
    backorderMessage: value('backorderMessage') as string | null | undefined,
    isAvailable: value('isAvailable') === true,
    availabilityStatus: value('availabilityStatus') as AvailabilityStatus | undefined,
  };
}
