import { NavigationStart, Router } from '@angular/router';
import { finalize, Subject } from 'rxjs';
import type { ProductAvailability } from '../../shared/models/product-stock.model';
import { ProductDetailApiService } from '../../features/catalog/services/product-detail-api.service';
import { modelId, requiresModel, validQuantity } from '../../shared/utils/product-stock.util';
import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ProductDetail } from '../../features/catalog/models/product-detail.model';
import {
  pickProductDetailPosterUrl,
  productDetailHas3D,
} from '../../features/catalog/utils/catalog-media.util';
import { GuestCartProductMeta } from '../../features/cart/models/cart.model';
import { ProductCardData } from '../../shared/models/product-card.model';
import { resolveProductCardTitle } from '../../shared/utils/product-card.util';
import { CartService } from './cart.service';
import { LanguageService } from './language.service';
import { ToastService } from './toast.service';

export interface CartModelSelection {
  productId: number;
  quantity: number;
  onSuccess?: () => void;
}

@Injectable({ providedIn: 'root' })
export class CartActionsService {
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  private readonly productApi = inject(ProductDetailApiService);
  private readonly router = inject(Router);
  private adding = false;
  readonly availabilityRefreshed = new Subject<ProductAvailability>();
  readonly modelSelection = signal<CartModelSelection | null>(null);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) this.modelSelection.set(null);
    });
  }

  addProductCard(product: ProductCardData, quantity = 1): void {
    const variantId = requiresModel(product.stock) ? modelId(product.productVariantId) : null;
    this.addSelection(product.id, variantId, quantity, this.metaFromCard(product), undefined);
  }

  addProductDetail(product: ProductDetail, quantity: number): void {
    this.addProductDetailThen(product, quantity, () => undefined);
  }

  addProductDetailThen(
    product: ProductDetail,
    quantity: number,
    onSuccess: () => void,
    onSettled?: (ok: boolean) => void,
  ): void {
    const variantId = requiresModel(product.stock) ? modelId(product.productVariantId) : null;
    this.addSelection(
      product.id,
      variantId,
      quantity,
      this.metaFromDetail(product),
      onSuccess,
      onSettled,
    );
  }

  private addSelection(
    productId: number,
    variantId: number | null,
    quantity: number,
    meta: GuestCartProductMeta,
    onSuccess?: () => void,
    onSettled?: (ok: boolean) => void,
  ): void {
    if (this.adding || this.cart.loading()) {
      onSettled?.(false);
      return;
    }
    this.adding = true;
    this.productApi.getProductAvailability(productId, variantId).subscribe({
      next: (availability) => {
        this.availabilityRefreshed.next(availability);
        if (requiresModel(availability.stock) && !variantId) {
          this.adding = false;
          this.modelSelection.set({ productId, quantity, onSuccess });
          onSettled?.(false);
          return;
        }
        if (
          !availability.isAvailable ||
          !validQuantity(quantity, availability.stock) ||
          (availability.stock &&
            !availability.stock.allowOnlineBackorder &&
            quantity > availability.stock.available)
        ) {
          this.adding = false;
          onSettled?.(false);
          this.toast.warning(
            this.translate.instant(
              !validQuantity(quantity, availability.stock)
                ? 'INVENTORY.INVALID_QUANTITY'
                : 'CART.ADD_UNAVAILABLE',
            ),
          );
          return;
        }
        this.cart
          .addItem(variantId, quantity, undefined, meta)
          .pipe(
            finalize(() => {
              this.adding = false;
            }),
          )
          .subscribe((ok) => {
            onSettled?.(ok);
            if (ok) {
              this.showAddedSuccess(
                this.language.currentLang() === 'ar' ? meta.productNameAr : meta.productNameEn,
              );
              onSuccess?.();
            } else
              this.productApi.getProductAvailability(productId, variantId).subscribe({
                next: (value) => this.availabilityRefreshed.next(value),
                error: () => undefined,
              });
          });
      },
      error: () => {
        this.adding = false;
        onSettled?.(false);
        this.toast.error(this.translate.instant('CART.ADD_UNAVAILABLE'));
      },
    });
  }

  private metaFromCard(product: ProductCardData): GuestCartProductMeta {
    return {
      productId: product.id,
      variantName: product.variantName,
      variantSku: 'variantSku' in product ? product.variantSku : undefined,
      productNameEn: product.title,
      productNameAr: product.titleAr ?? product.title,
      imageUrl: product.image,
      has3D: product.has3D,
      unitPrice: product.price,
      isAvailable: product.isAvailable,
    };
  }

  private metaFromDetail(product: ProductDetail): GuestCartProductMeta {
    return {
      productId: product.id,
      variantName: product.variantName,
      variantSku: product.productVariantId ? product.sku : undefined,
      productNameEn: product.nameEn,
      productNameAr: product.nameAr,
      imageUrl: pickProductDetailPosterUrl(product.images),
      has3D: productDetailHas3D(product.images),
      unitPrice: product.price / (product.priceQuantity || 1),
      isAvailable: product.isAvailable,
    };
  }

  private showAddedSuccess(productName: string): void {
    this.toast.successWithAction(
      this.translate.instant('CART.ADDED_SUCCESS', { name: productName }),
      this.translate.instant('CART.VIEW_CART'),
      '/cart',
    );
  }
}
