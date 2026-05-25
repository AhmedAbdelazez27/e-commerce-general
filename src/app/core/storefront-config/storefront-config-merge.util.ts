import { StorefrontConfig, StorefrontThemeConfig } from './storefront-config.model';

/** Merge remote theme patch over defaults (colors and related CSS tokens only). */
export function mergeStorefrontTheme(
  base: StorefrontThemeConfig,
  patch: Partial<StorefrontThemeConfig> | undefined,
): StorefrontThemeConfig {
  return { ...base, ...patch };
}

export function mergeStorefrontConfig(
  base: StorefrontConfig,
  patch: Partial<StorefrontConfig> | null | undefined,
): StorefrontConfig {
  if (!patch?.theme) {
    return base;
  }
  return {
    theme: mergeStorefrontTheme(base.theme, patch.theme),
  };
}
