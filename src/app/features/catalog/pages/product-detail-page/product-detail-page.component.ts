import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CartActionsService } from '../../../../core/services/cart-actions.service';
import { LanguageService } from '../../../../core/services/language.service';
import { ProductCardData } from '../../../../shared/models/product-card.model';
import { formatProductPrice } from '../../../../shared/utils/product-card.util';
import { CatalogBreadcrumbComponent } from '../../components/catalog-breadcrumb/catalog-breadcrumb.component';
import { ProductDetailInfoComponent } from '../../components/product-detail-info/product-detail-info.component';
import { ProductDetailRelatedComponent } from '../../components/product-detail-related/product-detail-related.component';
import { ProductGalleryComponent } from '../../components/product-gallery/product-gallery.component';
import { ProductDetail, ProductDetailLoadState } from '../../models/product-detail.model';
import { ProductDetailService } from '../../services/product-detail.service';
import {
  buildProductDetailBreadcrumbs,
  localizedBrandName,
  localizedProductName,
  mapRelatedToCardData,
  productDetailDiscountPercent,
} from '../../utils/product-detail.util';

@Component({
  selector: 'app-product-detail-page',
  imports: [
    DecimalPipe,
    RouterLink,
    TranslateModule,
    CatalogBreadcrumbComponent,
    ProductGalleryComponent,
    ProductDetailInfoComponent,
    ProductDetailRelatedComponent,
  ],
  templateUrl: './product-detail-page.component.html',
})
export class ProductDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productDetailService = inject(ProductDetailService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private readonly cartActions = inject(CartActionsService);

  readonly loadState = signal<ProductDetailLoadState>('idle');
  readonly product = signal<ProductDetail | null>(null);
  readonly relatedProducts = signal<ProductCardData[]>([]);
  readonly quantity = signal(1);
  readonly selectedImageIndex = signal(0);

  readonly breadcrumbs = computed(() => {
    const p = this.product();
    return p ? buildProductDetailBreadcrumbs(p) : [];
  });

  readonly discountPercent = computed(() => {
    const p = this.product();
    return p ? productDetailDiscountPercent(p) : null;
  });

  readonly maxQuantity = computed(() => {
    const p = this.product();
    if (!p?.isAvailable) {
      return 1;
    }
    return Math.max(1, p.stockQuantity);
  });

  readonly currencyLabel = computed(() => this.translate.instant('PRODUCT_CARD.CURRENCY'));

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('id'));
      if (!Number.isFinite(id) || id <= 0) {
        this.loadState.set('not-found');
        this.product.set(null);
        return;
      }
      this.loadProduct(id);
    });
  }

  displayName(): string {
    const p = this.product();
    return p ? localizedProductName(p, this.language.currentLang()) : '';
  }

  displayBrand(): string {
    const p = this.product();
    return p ? localizedBrandName(p, this.language.currentLang()) : '';
  }

  brandQueryParams(): Record<string, string> | undefined {
    const p = this.product();
    return p ? { brand: p.brandId } : undefined;
  }

  formatPrice(value: number): string {
    return formatProductPrice(value);
  }

  decrementQuantity(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  incrementQuantity(): void {
    this.quantity.update((q) => Math.min(this.maxQuantity(), q + 1));
  }

  onQuantityInput(event: Event): void {
    const raw = Number((event.target as HTMLInputElement).value);
    const next = Number.isFinite(raw) ? Math.floor(raw) : 1;
    this.quantity.set(Math.min(this.maxQuantity(), Math.max(1, next)));
  }

  addToCart(): void {
    const p = this.product();
    if (!p) {
      return;
    }
    this.cartActions.addProductDetail(p, this.quantity());
  }

  buyNow(): void {
    const p = this.product();
    if (!p) {
      return;
    }
    this.cartActions.addProductDetailThen(p, this.quantity(), () => {
      void this.router.navigate(['/checkout']);
    });
  }

  onRelatedAddToCart(item: ProductCardData): void {
    this.cartActions.addProductCard(item);
  }

  onWishlist(): void {
    // Wire to wishlist service when available
  }

  onRelatedClick(item: ProductCardData): void {
    void this.router.navigate(['/shop', item.id]);
  }

  private loadProduct(id: number): void {
    this.loadState.set('loading');
    this.product.set(null);
    this.quantity.set(1);
    this.selectedImageIndex.set(0);

    this.productDetailService
      .load(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ product, related }) => {
          if (!product) {
            this.loadState.set('not-found');
            this.product.set(null);
            this.relatedProducts.set(mapRelatedToCardData(related));
            return;
          }
          this.product.set(product);
          this.relatedProducts.set(mapRelatedToCardData(related));
          this.loadState.set('loaded');
        },
        error: () => {
          this.loadState.set('not-found');
        },
      });
  }
}
