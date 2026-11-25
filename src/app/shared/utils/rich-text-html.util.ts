/**
 * Allowlist sanitizer for product rich text stored as HTML (Summernote).
 * Rebuilds a fresh DOM so tags, attributes, and URLs outside the allowlist never survive.
 */

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'ul',
  'ol',
  'li',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'a',
  'h2',
  'h3',
  'h4',
  'span',
]);

/** Dropped with their contents so unwrapping cannot resurrect script, SVG, or form controls. */
const DROP_WITH_CONTENT = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'noscript',
  'noembed',
  'template',
  'svg',
  'math',
  'link',
  'meta',
  'title',
  'base',
  'form',
  'textarea',
  'button',
  'input',
  'select',
  'option',
  'video',
  'audio',
  'canvas',
  'frame',
  'frameset',
  'applet',
  'xml',
]);

const SAFE_URL_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);

export function sanitizeRichTextHtml(value: string | null | undefined): string {
  const source = value ?? '';
  if (!source.trim()) {
    return '';
  }
  if (typeof document === 'undefined') {
    return escapeText(stripTags(source));
  }

  const doc = document.implementation.createHTMLDocument('');
  const template = doc.createElement('template');
  template.innerHTML = source;
  const root = doc.createElement('div');
  appendSanitized(template.content, root);
  return root.innerHTML;
}

/** Visible text used for empty checks and the read-more threshold. Markup is not counted. */
export function richTextToPlain(value: string | null | undefined): string {
  const source = value ?? '';
  if (!source.trim()) {
    return '';
  }
  if (typeof document === 'undefined') {
    return stripTags(source).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const sanitized = sanitizeRichTextHtml(source);
  if (!sanitized) {
    return '';
  }
  const doc = document.implementation.createHTMLDocument('');
  const root = doc.createElement('div');
  root.innerHTML = sanitized;
  return (root.textContent ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function appendSanitized(source: Node, target: Node): void {
  for (const child of Array.from(source.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      target.appendChild(child.cloneNode(true));
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }

    const element = child as Element;
    const tag = element.tagName.toLowerCase();
    if (DROP_WITH_CONTENT.has(tag)) {
      continue;
    }
    if (!ALLOWED_TAGS.has(tag)) {
      appendSanitized(element, target);
      continue;
    }
    if (tag === 'a') {
      const href = safeHref(element.getAttribute('href'));
      if (!href) {
        appendSanitized(element, target);
        continue;
      }
      const anchor = element.ownerDocument.createElement('a');
      anchor.setAttribute('href', href);
      appendSanitized(element, anchor);
      target.appendChild(anchor);
      continue;
    }

    const clean = element.ownerDocument.createElement(tag);
    appendSanitized(element, clean);
    target.appendChild(clean);
  }
}

function safeHref(raw: string | null): string | null {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('\\')) {
    return null;
  }

  const compact = trimmed.replace(/[\u0000-\u0020\u007f]+/g, '').toLowerCase();
  if (!compact || compact.startsWith('//') || compact.startsWith('\\') || compact.startsWith('/\\')) {
    return null;
  }

  const scheme = /^([a-z][a-z0-9+.-]*):/.exec(compact)?.[1];
  if (scheme && !SAFE_URL_SCHEMES.has(scheme)) {
    return null;
  }
  return trimmed;
}

function stripTags(value: string): string {
  return value
    .replace(/<(script|style|iframe|object|embed|noscript|svg|math)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
