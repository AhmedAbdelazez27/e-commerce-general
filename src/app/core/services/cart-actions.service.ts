import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ProductDetail } from '../../features/catalog/models/product-detail.model';
import { ProductCardData } from '../../shared/models/product-card.model';
import { resolveProductCardTitle } from '../../shared/utils/product-card.util';
import { CartService } from './cart.service';
import { LanguageService } from './language.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class CartActionsService {
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  addProductCard(product: ProductCardData, quantity = 1): void {
    if (product.isAvailable === false) {
      this.toast.warning(this.translate.instant('CART.ADD_UNAVAILABLE'));
      return;
    }

    const variantId = product.productVariantId;
    if (variantId == null || variantId < 1) {
      this.toast.warning(this.translate.instant('CART.VARIANT_REQUIRED'));
      return;
    }

    const name = resolveProductCardTitle(product, this.language.currentLang());
    this.cart.addItem(variantId, quantity).subscribe((ok) => {
      if (ok) {
        this.showAddedSuccess(name);
      } else {
        this.toast.error(this.translate.instant('CART.ADDED_ERROR'));
      }
    });
  }

  addProductDetail(product: ProductDetail, quantity: number): void {
    if (!product.isAvailable) {
      this.toast.warning(this.translate.instant('CART.ADD_UNAVAILABLE'));
      return;
    }

    const variantId = product.productVariantId;
    if (variantId == null || variantId < 1) {
      this.toast.warning(this.translate.instant('CART.VARIANT_REQUIRED'));
      return;
    }

    const qty = Math.min(Math.max(1, quantity), product.stockQuantity);
    const name =
      this.language.currentLang() === 'ar' ? product.nameAr : product.nameEn;

    this.cart.addItem(variantId, qty).subscribe((ok) => {
      if (ok) {
        this.showAddedSuccess(name);
      } else {
        this.toast.error(this.translate.instant('CART.ADDED_ERROR'));
      }
    });
  }

  addProductDetailThen(product: ProductDetail, quantity: number, onSuccess: () => void): void {
    if (!product.isAvailable) {
      this.toast.warning(this.translate.instant('CART.ADD_UNAVAILABLE'));
      return;
    }

    const variantId = product.productVariantId;
    if (variantId == null || variantId < 1) {
      this.toast.warning(this.translate.instant('CART.VARIANT_REQUIRED'));
      return;
    }

    const qty = Math.min(Math.max(1, quantity), product.stockQuantity);
    const name =
      this.language.currentLang() === 'ar' ? product.nameAr : product.nameEn;

    this.cart.addItem(variantId, qty).subscribe((ok) => {
      if (ok) {
        this.showAddedSuccess(name);
        onSuccess();
      } else {
        this.toast.error(this.translate.instant('CART.ADDED_ERROR'));
      }
    });
  }

  private showAddedSuccess(productName: string): void {
    this.toast.successWithAction(
      this.translate.instant('CART.ADDED_SUCCESS', { name: productName }),
      this.translate.instant('CART.VIEW_CART'),
      '/cart',
    );
  }
}
