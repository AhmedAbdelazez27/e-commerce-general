const PENDING_KEY = 'pending_coupon_code';
const APPLIED_KEY = 'applied_coupon_code';

export function readPendingCouponCode(): string | null {
  return readCode(PENDING_KEY);
}

export function writePendingCouponCode(code: string | null): void {
  writeCode(PENDING_KEY, code);
}

export function readAppliedCouponCode(): string | null {
  return readCode(APPLIED_KEY);
}

export function writeAppliedCouponCode(code: string | null): void {
  writeCode(APPLIED_KEY, code);
}

export function clearCouponStorage(): void {
  sessionStorage.removeItem(PENDING_KEY);
  sessionStorage.removeItem(APPLIED_KEY);
}

function readCode(key: string): string | null {
  const raw = sessionStorage.getItem(key)?.trim();
  return raw ? raw.toUpperCase() : null;
}

function writeCode(key: string, code: string | null): void {
  const normalized = code?.trim().toUpperCase();
  if (normalized) {
    sessionStorage.setItem(key, normalized);
  } else {
    sessionStorage.removeItem(key);
  }
}
