import { StorefrontConfig } from './storefront-config.model';

export const DEFAULT_STOREFRONT_CONFIG: StorefrontConfig = {
  theme: {
    primaryColor: 'var(--portal-primary)',
    secondaryColor: 'var(--portal-secondary)',
    accentColor: 'var(--portal-danger)',
    successColor: 'var(--portal-success)',
    dangerColor: 'var(--portal-danger)',
    warningColor: 'var(--portal-warning)',
    backgroundColor: 'var(--portal-background)',
    fontFamily: 'Manrope, system-ui, -apple-system, "Segoe UI", sans-serif',
    borderRadius: '0.25rem',
  },
};

export const STOREFRONT_CONFIG_URL = '/config/storefront.config.json';
