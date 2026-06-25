let attachmentBaseUrl = '';

const ATTACHMENT_PATH_MARKERS = ['/appatt/', '/erpattachments/'];

/** ERP / portal host for relative attachment paths (no trailing slash). */
export function setAttachmentBaseUrl(url: string | null | undefined): void {
  const normalized = normalizeAttachmentBaseUrl(url);
  attachmentBaseUrl = normalized && !isLocalDevHost(normalized) ? normalized : '';
}

export function getAttachmentBaseUrl(): string {
  return attachmentBaseUrl;
}

function normalizeAttachmentBaseUrl(url: string | null | undefined): string {
  return url?.trim().replace(/\/$/, '') || '';
}

function isLocalDevHost(hostOrUrl: string): boolean {
  const value = hostOrUrl.trim().toLowerCase();
  if (!value) {
    return false;
  }

  if (value === 'localhost' || value === '127.0.0.1' || value === '::1') {
    return true;
  }

  try {
    const hostname = new URL(value.includes('://') ? value : `https://${value}`).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

function hasAttachmentPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return ATTACHMENT_PATH_MARKERS.some((marker) => lower.includes(marker));
}

/** Collapse duplicated ERP attachment path segments from API payloads. */
function normalizeAttachmentPath(path: string): string {
  let normalized = path;
  while (/\/appatt\/appatt\//i.test(normalized)) {
    normalized = normalized.replace(/\/appatt\/appatt\//gi, '/appatt/');
  }
  return normalized;
}

function resolveAttachmentBaseUrl(baseUrl?: string | null): string {
  const candidate = normalizeAttachmentBaseUrl(baseUrl) || attachmentBaseUrl;
  return candidate && !isLocalDevHost(candidate) ? candidate : '';
}

function rewriteAbsoluteAttachmentUrl(url: string, baseUrl?: string | null): string {
  const base = resolveAttachmentBaseUrl(baseUrl);
  if (!base) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (!hasAttachmentPath(parsed.pathname)) {
      return url;
    }

    if (isLocalDevHost(parsed.hostname)) {
      return normalizeAttachmentPath(`${base}${parsed.pathname}${parsed.search}`);
    }
  } catch {
    return url;
  }

  return url;
}

/**
 * Turn ERP-relative attachment paths into absolute URLs.
 * Rewrites localhost / storefront hosts to the configured attachments base.
 */
export function resolveAttachmentUrl(
  url: string | null | undefined,
  baseUrl?: string | null,
): string | null {
  const trimmed = url?.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = normalizeAttachmentPath(trimmed);

  if (/^https?:\/\//i.test(normalized)) {
    return rewriteAbsoluteAttachmentUrl(normalized, baseUrl);
  }

  if (normalized.startsWith('//')) {
    return rewriteAbsoluteAttachmentUrl(`https:${normalized}`, baseUrl);
  }

  const base = resolveAttachmentBaseUrl(baseUrl);
  if (normalized.startsWith('/') && base) {
    return normalizeAttachmentPath(`${base}${normalized}`);
  }

  return normalized;
}

export function resolveAttachmentUrlOptional(
  url: string | null | undefined,
  baseUrl?: string | null,
): string | undefined {
  return resolveAttachmentUrl(url, baseUrl) ?? undefined;
}

/** Ignore localhost portal bases from API; use env attachments host instead. */
export function pickPortalAttachmentBaseUrl(url: string | null | undefined): string | undefined {
  const normalized = normalizeAttachmentBaseUrl(url);
  if (!normalized || isLocalDevHost(normalized)) {
    return undefined;
  }
  return normalized;
}
