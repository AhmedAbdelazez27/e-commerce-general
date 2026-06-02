import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { ProductDetail } from '../../features/catalog/models/product-detail.model';
import { ProductCardData } from '../../shared/models/product-card.model';
import { resolveProductCardTitle } from '../../shared/utils/product-card.util';
import { LanguageService } from './language.service';
import { CartService } from './cart.service';

@Injectable({ providedIn: 'root' })
export class CartActionsService {
  private readonly cart = inject(CartService);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  addProductCard(product: ProductCardData, quantity = 1): void {
    if (product.isAvailable === false) {
      this.toastr.warning(this.translate.instant('CART.ADD_UNAVAILABLE'));
      return;
    }

    const name = resolveProductCardTitle(product, this.language.currentLang());
    this.cart.addItem(product.id, quantity, product.price, name).subscribe((ok) => {
      if (ok) {
        this.showAddedSuccess(name);
      } else {
        this.toastr.error(this.translate.instant('CART.ADDED_ERROR'));
      }
    });
  }

  addProductDetail(product: ProductDetail, quantity: number): void {
    if (!product.isAvailable) {
      this.toastr.warning(this.translate.instant('CART.ADD_UNAVAILABLE'));
      return;
    }

    const qty = Math.min(Math.max(1, quantity), product.stockQuantity);
    const name =
      this.language.currentLang() === 'ar' ? product.nameAr : product.nameEn;

    this.cart.addItem(product.id, qty, product.price, name).subscribe((ok) => {
      if (ok) {
        this.showAddedSuccess(name);
      } else {
        this.toastr.error(this.translate.instant('CART.ADDED_ERROR'));
      }
    });
  }

  addProductDetailThen(product: ProductDetail, quantity: number, onSuccess: () => void): void {
    if (!product.isAvailable) {
      this.toastr.warning(this.translate.instant('CART.ADD_UNAVAILABLE'));
      return;
    }

    const qty = Math.min(Math.max(1, quantity), product.stockQuantity);
    const name =
      this.language.currentLang() === 'ar' ? product.nameAr : product.nameEn;

    this.cart.addItem(product.id, qty, product.price, name).subscribe((ok) => {
      if (ok) {
        onSuccess();
      } else {
        this.toastr.error(this.translate.instant('CART.ADDED_ERROR'));
      }
    });
  }

  private showAddedSuccess(productName: string): void {
    this.toastr.success(
      this.translate.instant('CART.ADDED_SUCCESS', { name: productName }),
    );
  }
}
