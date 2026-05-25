import { StorefrontConfig } from './storefront-config.model';

export const DEFAULT_STOREFRONT_CONFIG: StorefrontConfig = {
  theme: {
    primaryColor: '#775a19',
    secondaryColor: '#4e5f7c',
    accentColor: '#D24858',
    successColor: '#198754',
    dangerColor: '#D24858',
    warningColor: '#ffc107',
    backgroundColor: '#f9f9f7',
    fontFamily: 'Manrope, system-ui, -apple-system, "Segoe UI", sans-serif',
    borderRadius: '0.25rem',
  },
};

export const STOREFRONT_CONFIG_URL = '/config/storefront.config.json';
