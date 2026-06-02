import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { CartCouponComponent } from '../../components/cart-coupon/cart-coupon.component';
import { CartEmptyStateComponent } from '../../components/cart-empty-state/cart-empty-state.component';
import { CartItemRowComponent } from '../../components/cart-item-row/cart-item-row.component';
import { CartOrderSummaryComponent } from '../../components/cart-order-summary/cart-order-summary.component';
import { CartPageFacade } from '../../services/cart-page.facade';

@Component({
  selector: 'app-cart-page',
  imports: [
    TranslateModule,
    CartItemRowComponent,
    CartCouponComponent,
    CartOrderSummaryComponent,
    CartEmptyStateComponent,
  ],
  providers: [CartPageFacade],
  templateUrl: './cart-page.component.html',
})
export class CartPageComponent implements OnInit {
  private readonly router = inject(Router);
  readonly facade = inject(CartPageFacade);

  ngOnInit(): void {
    this.facade.initPage();
  }

  onQuantityChange(event: { productId: number; quantity: number }): void {
    this.facade.updateQuantity(event.productId, event.quantity);
  }

  onRemove(productId: number): void {
    this.facade.removeItem(productId);
  }

  onCouponInput(value: string): void {
    this.facade.couponInput.set(value);
  }

  checkout(): void {
    if (!this.facade.tryCheckout()) {
      return;
    }
    void this.router.navigate(['/checkout']);
  }
}
