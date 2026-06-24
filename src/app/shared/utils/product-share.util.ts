import { productDetailLinkSegment } from '../../features/catalog/utils/product-detail-api.mapper';

export interface ProductSharePayload {
  title: string;
  text: string;
  url: string;
}

export function buildProductSharePath(product: { id: number; slug?: string | null }): string {
  const segment = productDetailLinkSegment(product);
  return `/shop/${segment}`;
}

export function buildProductShareUrl(
  origin: string,
  product: { id: number; slug?: string | null },
): string {
  const base = origin.replace(/\/$/, '');
  return `${base}${buildProductSharePath(product)}`;
}

export function buildWhatsAppShareUrl(text: string, url: string): string {
  const message = [text.trim(), url.trim()].filter(Boolean).join('\n');
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
