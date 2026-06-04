import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageService } from '../../../../core/services/language.service';
import { formatProductPrice } from '../../../../shared/utils/product-card.util';
import { CartLineItemView } from '../../models/cart-view.model';

@Component({
  selector: 'app-cart-item-row',
  imports: [RouterLink, TranslateModule],
  templateUrl: './cart-item-row.component.html',
})
export class CartItemRowComponent {
  private readonly language = inject(LanguageService);

  readonly item = input.required<CartLineItemView>();
  readonly currencyLabel = input.required<string>();
  readonly disabled = input(false);

  readonly quantityChange = output<{ cartDetailId: number; quantity: number }>();
  readonly remove = output<number>();

  displayTitle(): string {
    const i = this.item();
    return this.language.currentLang() === 'ar' ? i.titleAr : i.titleEn;
  }

  displayBrand(): string {
    const i = this.item();
    return this.language.currentLang() === 'ar' ? i.brandAr : i.brandEn;
  }

  formatPrice(value: number): string {
    return formatProductPrice(value);
  }

  decrement(): void {
    const i = this.item();
    this.quantityChange.emit({ cartDetailId: i.cartDetailId, quantity: i.quantity - 1 });
  }

  increment(): void {
    const i = this.item();
    this.quantityChange.emit({ cartDetailId: i.cartDetailId, quantity: i.quantity + 1 });
  }

  onQuantityInput(event: Event): void {
    const raw = Number((event.target as HTMLInputElement).value);
    const qty = Number.isFinite(raw) ? Math.floor(raw) : 1;
    const i = this.item();
    this.quantityChange.emit({
      cartDetailId: i.cartDetailId,
      quantity: Math.min(i.maxQuantity, Math.max(1, qty)),
    });
  }

  onRemove(): void {
    this.remove.emit(this.item().cartDetailId);
  }
}
