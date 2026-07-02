import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ToastService } from './toast.service';
import { ProductSharePayload, buildWhatsAppShareUrl } from '../../shared/utils/product-share.util';

@Injectable({ providedIn: 'root' })
export class ProductShareService {
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  canNativeShare(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  }

  async shareNative(payload: ProductSharePayload): Promise<void> {
    if (!this.canNativeShare()) {
      return;
    }
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      this.toast.error(this.translate.instant('PRODUCT_SHARE.SHARE_FAILED'));
    }
  }

  shareWhatsApp(payload: ProductSharePayload): void {
    const waUrl = buildWhatsAppShareUrl(payload.text, payload.url);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  async copyLink(url: string): Promise<void> {
    try {
      // Clipboard API is only available in secure contexts (HTTPS/localhost).
      // Staging is often served over plain HTTP, so fall back to a legacy copy.
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else if (!this.legacyCopy(url)) {
        throw new Error('copy-unsupported');
      }
      this.toast.success(this.translate.instant('PRODUCT_SHARE.COPIED'));
    } catch {
      this.toast.error(this.translate.instant('PRODUCT_SHARE.COPY_FAILED'));
    }
  }

  /** Fallback copy for non-secure contexts using a temporary textarea. */
  private legacyCopy(url: string): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    const selection = document.getSelection();
    const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    textarea.select();
    textarea.setSelectionRange(0, url.length);

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }

    document.body.removeChild(textarea);

    if (previousRange && selection) {
      selection.removeAllRanges();
      selection.addRange(previousRange);
    }

    return copied;
  }
}
