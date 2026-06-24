import { Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ProductShareService } from '../../../core/services/product-share.service';
import { ProductSharePayload } from '../../utils/product-share.util';

@Component({
  selector: 'app-product-share-menu',
  imports: [TranslateModule],
  templateUrl: './product-share-menu.component.html',
})
export class ProductShareMenuComponent {
  private readonly shareService = inject(ProductShareService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly title = input.required<string>();
  readonly url = input.required<string>();
  readonly shareText = input.required<string>();
  readonly compact = input(false);

  readonly open = signal(false);

  canNativeShare(): boolean {
    return this.shareService.canNativeShare();
  }

  toggle(event: Event): void {
    event.stopPropagation();
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  async onNativeShare(): Promise<void> {
    await this.shareService.shareNative(this.payload());
    this.close();
  }

  onWhatsAppShare(): void {
    this.shareService.shareWhatsApp(this.payload());
    this.close();
  }

  async onCopyLink(): Promise<void> {
    await this.shareService.copyLink(this.url());
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private payload(): ProductSharePayload {
    return {
      title: this.title(),
      text: this.shareText(),
      url: this.url(),
    };
  }
}
