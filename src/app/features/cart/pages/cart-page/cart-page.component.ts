import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { CartService } from '../../../../core/services/cart.service';
import { AuthTokenService } from '../../../../core/services/auth-token.service';
import { CartApiService } from '../../services/cart-api.service';

@Component({
  selector: 'app-cart-page',
  imports: [DecimalPipe, RouterLink, TranslateModule],
  templateUrl: './cart-page.component.html',
})
export class CartPageComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly cartApi = inject(CartApiService);
  private readonly auth = inject(AuthTokenService);

  protected readonly cart = this.cartService.cart;
  protected readonly loading = this.cartService.loading;

  ngOnInit(): void {
    this.cartService.refresh();
  }

  protected removeItem(productId: number): void {
    if (this.auth.isLoggedIn()) {
      this.cartApi.removeItem(productId).subscribe(() => this.cartService.refresh());
      return;
    }

    const current = this.cartService.cart();
    if (!current?.Items) {
      return;
    }
    const items = current.Items.filter((i) => i.ProductId !== productId);
    this.cartService.setGuestCart({ ...current, Items: items });
  }
}
