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
      await navigator.clipboard.writeText(url);
      this.toast.success(this.translate.instant('PRODUCT_SHARE.COPIED'));
    } catch {
      this.toast.error(this.translate.instant('PRODUCT_SHARE.COPY_FAILED'));
    }
  }
}
