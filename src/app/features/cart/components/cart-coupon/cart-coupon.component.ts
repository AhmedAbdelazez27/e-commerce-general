import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { CartCouponState } from '../../models/cart-view.model';

@Component({
  selector: 'app-cart-coupon',
  imports: [FormsModule, TranslateModule],
  templateUrl: './cart-coupon.component.html',
})
export class CartCouponComponent {
  readonly couponInput = input.required<string>();
  readonly couponState = input.required<CartCouponState>();

  readonly couponInputChange = output<string>();
  readonly apply = output<void>();
  readonly remove = output<void>();
}
