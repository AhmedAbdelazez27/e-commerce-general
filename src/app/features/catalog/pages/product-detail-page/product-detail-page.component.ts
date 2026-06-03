import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CartActionsService } from '../../../../core/services/cart-actions.service';
import { WishlistActionsService } from '../../../../core/services/wishlist-actions.service';
import { LanguageService } from '../../../../core/services/language.service';
import { ProductCardData } from '../../../../shared/models/product-card.model';
import { formatProductPrice } from '../../../../shared/utils/product-card.util';
import { CatalogBreadcrumbComponent } from '../../components/catalog-breadcrumb/catalog-breadcrumb.component';
import { ProductDetailInfoComponent } from '../../components/product-detail-info/product-detail-info.component';
import { ProductDetailRelatedComponent } from '../../components/product-detail-related/product-detail-related.component';
import { ProductGalleryComponent } from '../../components/product-gallery/product-gallery.component';
import { ProductDetail, ProductDetailLoadState, ProductDetailVariant } from '../../models/product-detail.model';
import { ProductDetailLoadRef } from '../../models/catalog-public-product.model';
import { ProductDetailService } from '../../services/product-detail.service';
import { navigateToProductDetail } from '../../utils/catalog-navigation.util';
import { parseProductRouteParam } from '../../utils/product-detail-api.mapper';
import {
  buildProductDetailBreadcrumbs,
  localizedBrandName,
  localizedProductName,
  mapProductDetailToCardData,
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
  private readonly wishlistActions = inject(WishlistActionsService);

  readonly loadState = signal<ProductDetailLoadState>('idle');
  readonly product = signal<ProductDetail | null>(null);
  readonly variants = signal<ProductDetailVariant[]>([]);
  readonly relatedProducts = signal<ProductCardData[]>([]);
  readonly quantity = signal(1);
  readonly selectedImageIndex = signal(0);

  private currentRef = signal<ProductDetailLoadRef>({});

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
      const ref = parseProductRouteParam(params.get('id'));
      if (!ref.productId && !ref.slug) {
        this.loadState.set('not-found');
        this.product.set(null);
        return;
      }
      this.currentRef.set(ref);
      this.loadProduct(ref);
    });

    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const ref = this.currentRef();
      if (ref.productId || ref.slug) {
        this.loadProduct(ref);
      }
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
    return p?.brandId ? { brand: p.brandId } : undefined;
  }

  formatPrice(value: number): string {
    return formatProductPrice(value);
  }

  decrementQuantity(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
    this.refreshDisplayedPrice();
  }

  incrementQuantity(): void {
    this.quantity.update((q) => Math.min(this.maxQuantity(), q + 1));
    this.refreshDisplayedPrice();
  }

  onQuantityInput(event: Event): void {
    const raw = Number((event.target as HTMLInputElement).value);
    const next = Number.isFinite(raw) ? Math.floor(raw) : 1;
    this.quantity.set(Math.min(this.maxQuantity(), Math.max(1, next)));
    this.refreshDisplayedPrice();
  }

  onVariantSelect(variantId: number): void {
    const product = this.product();
    const variant = this.variants().find((entry) => entry.id === variantId);
    if (!product || !variant || product.selectedVariantId === variantId) {
      return;
    }

    this.productDetailService
      .selectVariant(product, variant, this.quantity())
      .subscribe((updated) => {
        this.product.set(updated);
        this.selectedImageIndex.set(0);
      });
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
    const p = this.product();
    if (!p) {
      return;
    }
    this.wishlistActions.toggle(mapProductDetailToCardData(p));
  }

  onRelatedWishlist(product: ProductCardData): void {
    this.wishlistActions.toggle(product);
  }

  onRelatedClick(item: ProductCardData): void {
    navigateToProductDetail(this.router, item);
  }

  private loadProduct(ref: ProductDetailLoadRef): void {
    this.loadState.set('loading');
    this.product.set(null);
    this.variants.set([]);
    this.quantity.set(1);
    this.selectedImageIndex.set(0);

    this.productDetailService
      .load(ref)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ product, variants, related }) => {
          if (!product) {
            this.loadState.set('not-found');
            this.product.set(null);
            this.variants.set([]);
            this.relatedProducts.set(mapRelatedToCardData(related));
            return;
          }
          this.product.set(product);
          this.variants.set(variants);
          this.relatedProducts.set(mapRelatedToCardData(related));
          this.loadState.set('loaded');
        },
        error: () => {
          this.loadState.set('not-found');
        },
      });
  }

  private refreshDisplayedPrice(): void {
    const product = this.product();
    if (!product?.productVariantId) {
      return;
    }

    this.productDetailService
      .refreshPrice(product, this.quantity())
      .subscribe((updated) => this.product.set(updated));
  }
}
