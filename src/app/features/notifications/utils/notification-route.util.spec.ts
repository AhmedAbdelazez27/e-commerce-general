import { describe, expect, it } from 'vitest';

import { resolveNotificationTarget, sanitizeNotificationUrl } from './notification-route.util';

describe('notification-route.util', () => {
  it('maps order reference to account order details', () => {
    expect(resolveNotificationTarget('Order', 12)).toEqual(['/account/orders', '12']);
  });

  it('maps shipment and payment references to order details', () => {
    expect(resolveNotificationTarget('Shipment', 8)).toEqual(['/account/orders', '8']);
    expect(resolveNotificationTarget('Payment', 3)).toEqual(['/account/orders', '3']);
  });

  it('maps promotion to shop and return to returns list', () => {
    expect(resolveNotificationTarget('Promotion', 1)).toEqual(['/shop']);
    expect(resolveNotificationTarget('Return', 1)).toEqual(['/account/returns']);
  });

  it('rejects unknown reference types', () => {
    expect(resolveNotificationTarget('Unknown', 1)).toBeNull();
  });

  it('blocks external and javascript URLs', () => {
    expect(sanitizeNotificationUrl('https://evil.example')).toBeNull();
    expect(sanitizeNotificationUrl('javascript:alert(1)')).toBeNull();
  });

  it('allows safe internal routes', () => {
    expect(sanitizeNotificationUrl('/account/orders/15')).toEqual(['/account/orders', '15']);
    expect(sanitizeNotificationUrl('/notifications')).toEqual(['/notifications']);
  });
});
