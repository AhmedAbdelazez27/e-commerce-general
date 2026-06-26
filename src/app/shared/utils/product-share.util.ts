export interface ProductSharePayload {
  title: string;
  text: string;
  url: string;
}

export function buildWhatsAppShareUrl(text: string, url: string): string {
  const message = [text.trim(), url.trim()].filter(Boolean).join('\n');
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
