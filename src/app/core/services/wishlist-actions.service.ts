import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ProductCardData } from '../../shared/models/product-card.model';
import { resolveProductCardTitle } from '../../shared/utils/product-card.util';
import { CartService } from './cart.service';
import { LanguageService } from './language.service';
import { ToastService } from './toast.service';
import { WishlistService } from './wishlist.service';

@Injectable({ providedIn: 'root' })
export class WishlistActionsService {
  private readonly wishlist = inject(WishlistService);
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  toggle(product: ProductCardData): void {
    const name = resolveProductCardTitle(product, this.language.currentLang());
    const action = this.wishlist.toggle(product);

    if (action === 'added') {
      this.toast.successWithAction(
        this.translate.instant('WISHLIST.ADDED_SUCCESS', { name }),
        this.translate.instant('WISHLIST.VIEW_WISHLIST'),
        '/wishlist',
      );
      return;
    }

    this.toast.info(this.translate.instant('WISHLIST.REMOVED_SUCCESS', { name }));
  }

  moveToCart(product: ProductCardData): void {
    const name = resolveProductCardTitle(product, this.language.currentLang());
    this.wishlist.moveToCart(product);
    this.cart.refresh();
    this.toast.successWithAction(
      this.translate.instant('CART.ADDED_SUCCESS', { name }),
      this.translate.instant('CART.VIEW_CART'),
      '/cart',
    );
  }
}
