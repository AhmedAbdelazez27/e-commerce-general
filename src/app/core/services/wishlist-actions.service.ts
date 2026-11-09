import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ProductCardData } from '../../shared/models/product-card.model';
import { modelId, requiresModel } from '../../shared/utils/product-stock.util';
import { resolveProductCardTitle } from '../../shared/utils/product-card.util';
import { ProductDetailApiService } from '../../features/catalog/services/product-detail-api.service';
import { apiErrorMessage } from '../utils/api-error-message.util';
import { LanguageService } from './language.service';
import { ToastService } from './toast.service';
import { WishlistService } from './wishlist.service';

@Injectable({ providedIn: 'root' })
export class WishlistActionsService {
  private readonly wishlist = inject(WishlistService);
  private readonly productApi = inject(ProductDetailApiService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly router = inject(Router);
  private acting = false;

  toggle(product: ProductCardData): void {
    void this.run(product, false);
  }
  moveToCart(product: ProductCardData): void {
    void this.run(product, true);
  }

  private async run(product: ProductCardData, move: boolean): Promise<void> {
    if (this.acting || this.wishlist.busy()) return;
    this.acting = true;
    try {
      const removing = !move && this.wishlist.isInWishlist(product.id, product.productVariantId);
      let selection = product;
      if (!removing && (move || !product.stock)) {
        const availability = await firstValueFrom(
          this.productApi.getProductAvailability(product.id, modelId(product.productVariantId)),
        );
        selection = {
          ...product,
          stock: availability.stock,
          isAvailable: availability.isAvailable,
        };
        if (move && !availability.isAvailable) {
          this.toast.warning(this.translate.instant('CART.ADD_UNAVAILABLE'));
          return;
        }
      }
      if (!removing && requiresModel(selection.stock) && !modelId(selection.productVariantId)) {
        this.toast.warning(this.translate.instant('CART.VARIANT_REQUIRED'));
        void this.router.navigate(['/shop', String(product.id)]);
        return;
      }
      const name = resolveProductCardTitle(product, this.language.currentLang());
      if (move) {
        if (await firstValueFrom(this.wishlist.moveToCart(selection))) {
          this.toast.successWithAction(
            this.translate.instant('CART.ADDED_SUCCESS', { name }),
            this.translate.instant('CART.VIEW_CART'),
            '/cart',
          );
        }
      } else {
        const action = await firstValueFrom(this.wishlist.toggle(selection));
        if (action === 'added')
          this.toast.successWithAction(
            this.translate.instant('WISHLIST.ADDED_SUCCESS', { name }),
            this.translate.instant('WISHLIST.VIEW_WISHLIST'),
            '/wishlist',
          );
        else if (action === 'removed')
          this.toast.info(this.translate.instant('WISHLIST.REMOVED_SUCCESS', { name }));
      }
    } catch (error) {
      const fallback = this.translate.instant('WISHLIST.REQUEST_FAILED');
      this.toast.error(
        error instanceof Error && error.message.startsWith('WISHLIST_')
          ? fallback
          : apiErrorMessage(error, fallback),
      );
    } finally {
      this.acting = false;
    }
  }
}
