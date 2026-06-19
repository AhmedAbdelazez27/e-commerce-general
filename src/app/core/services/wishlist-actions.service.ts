import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { GuestCartProductMeta } from '../../features/cart/models/cart.model';
import { ProductCardData } from '../../shared/models/product-card.model';
import { resolveProductCardTitle } from '../../shared/utils/product-card.util';
import { AuthTokenService } from './auth-token.service';
import { CartService } from './cart.service';
import { LanguageService } from './language.service';
import { ToastService } from './toast.service';
import { WishlistService } from './wishlist.service';

@Injectable({ providedIn: 'root' })
export class WishlistActionsService {
  private readonly wishlist = inject(WishlistService);
  private readonly cart = inject(CartService);
  private readonly auth = inject(AuthTokenService);
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
    const variantId = product.productVariantId ?? 0;

    if (this.auth.isLoggedIn() && variantId > 0) {
      this.wishlist.moveToCart(product);
      this.cart.refresh();
      this.showMovedToCart(name);
      return;
    }

    if (variantId < 1) {
      return;
    }

    this.cart.addItem(variantId, 1, null, this.metaFromCard(product)).subscribe((ok) => {
      if (ok) {
        this.wishlist.remove(product.id);
        this.showMovedToCart(name);
      }
    });
  }

  private metaFromCard(product: ProductCardData): GuestCartProductMeta {
    return {
      productId: product.id,
      productNameEn: product.title,
      productNameAr: product.titleAr ?? product.title,
      imageUrl: product.image,
      unitPrice: product.price,
      isAvailable: product.isAvailable,
    };
  }

  private showMovedToCart(name: string): void {
    this.toast.successWithAction(
      this.translate.instant('CART.ADDED_SUCCESS', { name }),
      this.translate.instant('CART.VIEW_CART'),
      '/cart',
    );
  }
}
