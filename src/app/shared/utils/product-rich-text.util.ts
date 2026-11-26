import { SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

const RICH_TEXT_MARKUP = /<\/?[a-z][^<>]*>|<!--/i;

export interface RichTextContent {
  /** Sanitized HTML when the source contains markup. Plain text keeps this null. */
  html: string | null;
  text: string;
  hasContent: boolean;
}

/** Same rich-text path as the product long description: sanitize markup, or keep legacy plain text. */
export function resolveRichTextContent(
  value: string | null | undefined,
  sanitizer: DomSanitizer,
  documentRef: Document,
): RichTextContent {
  const source = value ?? '';
  if (!RICH_TEXT_MARKUP.test(source)) {
    const text = source.replace(/\s+/g, ' ').trim();
    return { html: null, text, hasContent: text.length > 0 };
  }

  const html = sanitizer.sanitize(SecurityContext.HTML, source) ?? '';
  const preview = documentRef.createElement('template');
  preview.innerHTML = html;
  preview.content
    .querySelectorAll('br, p, div, li, blockquote, h1, h2, h3, h4, h5, h6, td, th, pre')
    .forEach((block) => block.after(' '));

  const text = (preview.content.textContent ?? '').replace(/\s+/g, ' ').trim();
  return {
    html,
    text,
    hasContent: text.length > 0 || preview.content.querySelector('img[src]') !== null,
  };
}
