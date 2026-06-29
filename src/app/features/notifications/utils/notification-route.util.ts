const ALLOWED_ROUTE_PREFIXES = [
  '/account',
  '/shop',
  '/notifications',
  '/home',
  '/cart',
  '/wishlist',
  '/checkout',
  '/brands',
  '/categories',
  '/faq',
  '/contact',
] as const;

const REFERENCE_TYPE_ROUTES: Record<string, (id: number) => string[] | null> = {
  order: (id) => (id > 0 ? ['/account/orders', String(id)] : null),
  shipment: (id) => (id > 0 ? ['/account/orders', String(id)] : null),
  payment: (id) => (id > 0 ? ['/account/orders', String(id)] : null),
  promotion: () => ['/shop'],
  return: () => ['/account/returns'],
};

function isSafeRouterCommand(command: string[]): boolean {
  if (!command.length || !command[0].startsWith('/')) {
    return false;
  }

  const path =
    command.length === 1 ? command[0] : `${command[0]}/${command.slice(1).join('/')}`.replace(/\/+/g, '/');

  if (path.includes('://') || path.toLowerCase().includes('javascript:')) {
    return false;
  }

  return ALLOWED_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * Maps backend reference metadata to an internal router command.
 * Returns null when navigation should fall back to the notification center.
 */
export function resolveNotificationTarget(
  referenceType?: string | null,
  referenceId?: number | null,
): string[] | null {
  if (!referenceType?.trim()) {
    return null;
  }

  const normalizedType = referenceType.trim().toLowerCase();
  const resolver = REFERENCE_TYPE_ROUTES[normalizedType];
  if (!resolver) {
    return null;
  }

  const id = referenceId != null && Number.isFinite(referenceId) ? referenceId : 0;
  const segments = resolver(id);
  if (!segments) {
    return null;
  }

  return isSafeRouterCommand(segments) ? segments : null;
}

/**
 * Validates a user-provided or push-provided URL before navigation.
 */
export function sanitizeNotificationUrl(url?: string | null): string[] | null {
  if (!url?.trim()) {
    return null;
  }

  const trimmed = url.trim();
  if (trimmed.includes('://') || trimmed.toLowerCase().startsWith('javascript:')) {
    return null;
  }

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  const orderMatch = path.match(/^\/account\/orders\/(\d+)$/);
  if (orderMatch) {
    const command = ['/account/orders', orderMatch[1]!];
    return isSafeRouterCommand(command) ? command : null;
  }

  const allowedStaticPaths = [
    '/notifications',
    '/shop',
    '/home',
    '/cart',
    '/wishlist',
    '/checkout',
    '/faq',
    '/contact',
    '/brands',
    '/categories',
    '/account/returns',
    '/account/orders',
    '/account/profile',
  ];

  if (allowedStaticPaths.includes(path)) {
    return isSafeRouterCommand([path]) ? [path] : null;
  }

  return null;
}
