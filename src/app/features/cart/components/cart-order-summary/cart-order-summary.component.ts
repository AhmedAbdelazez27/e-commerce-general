import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { formatProductPrice } from '../../../../shared/utils/product-card.util';
import { CartOrderSummaryView } from '../../models/cart-view.model';

@Component({
  selector: 'app-cart-order-summary',
  imports: [RouterLink, TranslateModule],
  templateUrl: './cart-order-summary.component.html',
})
export class CartOrderSummaryComponent {
  readonly summary = input.required<CartOrderSummaryView>();
  readonly currencyLabel = input.required<string>();
  readonly checkoutDisabled = input(false);

  readonly checkout = output<void>();

  formatPrice(value: number): string {
    return formatProductPrice(value);
  }
}
