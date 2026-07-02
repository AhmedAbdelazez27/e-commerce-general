import { Component, computed, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageService } from '../../../../core/services/language.service';
import { formatProductPrice } from '../../../../shared/utils/product-card.util';
import type { CartLineItemView } from '../../../cart/models/cart-view.model';

export interface CheckoutSummaryTotals {
  subtotal: number;
  productDiscount: number;
  couponDiscount: number;
  discount: number;
  shippingAmount: number;
  total: number;
}

@Component({
  selector: 'app-checkout-order-summary',
  imports: [TranslateModule],
  templateUrl: './checkout-order-summary.component.html',
})
export class CheckoutOrderSummaryComponent {
  private readonly language = inject(LanguageService);

  readonly lineItems = input.required<CartLineItemView[]>();
  readonly totals = input.required<CheckoutSummaryTotals>();
  readonly currencyLabel = input.required<string>();
  readonly showDeliveryLine = input(true);

  readonly itemCount = computed(() =>
    this.lineItems().reduce((sum, item) => sum + item.quantity, 0),
  );

  formatPrice(value: number): string {
    return formatProductPrice(value);
  }

  lineTitle(item: CartLineItemView): string {
    return this.language.currentLang() === 'ar' && item.titleAr ? item.titleAr : item.titleEn;
  }
}
