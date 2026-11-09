export interface PendingCheckout {
  customerId: number;
  cartId: number;
}
const KEY = 'tenx_pending_checkout';

export function readPendingCheckout(): PendingCheckout | null {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}
export function writePendingCheckout(value: PendingCheckout | null): void {
  try {
    if (value) sessionStorage.setItem(KEY, JSON.stringify(value));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* In-memory submission guards still apply if storage is unavailable. */
  }
}
