import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { combineLatest } from 'rxjs';

import { ProductSeoService } from '../../../../core/portal-seo/product-seo.service';
import { CartActionsService } from '../../../../core/services/cart-actions.service';
import { AuthTokenService } from '../../../../core/services/auth-token.service';
import { WishlistActionsService } from '../../../../core/services/wishlist-actions.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { LanguageService } from '../../../../core/services/language.service';
import { ProductCardData } from '../../../../shared/models/product-card.model';
import { ProductShareMenuComponent } from '../../../../shared/components/product-share-menu/product-share-menu.component';
import { formatProductPrice } from '../../../../shared/utils/product-card.util';
import { CatalogBreadcrumbComponent } from '../../components/catalog-breadcrumb/catalog-breadcrumb.component';
import { ProductDetailInfoComponent } from '../../components/product-detail-info/product-detail-info.component';
import { ProductDetailRelatedComponent } from '../../components/product-detail-related/product-detail-related.component';
import { ProductGalleryComponent } from '../../components/product-gallery/product-gallery.component';
import { ProductDetail, ProductDetailLoadState, ProductDetailVariant } from '../../models/product-detail.model';
import { ProductDetailLoadRef } from '../../models/catalog-public-product.model';
import type { PublicProductShareDto } from '../../models/product-share-info.model';
import { ProductDetailService } from '../../services/product-detail.service';
import { ProductShareInfoService } from '../../services/product-share-info.service';
import { navigateToProductDetail } from '../../utils/catalog-navigation.util';
import { resolveProductLoadRef } from '../../utils/product-detail-api.mapper';
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
    ProductShareMenuComponent,
  ],
  templateUrl: './product-detail-page.component.html',
})
export class ProductDetailPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productDetailService = inject(ProductDetailService);
  private readonly productShareInfo = inject(ProductShareInfoService);
  private readonly productSeo = inject(ProductSeoService);
  private readonly language = inject(LanguageService);
  private readonly currency = inject(CurrencyService);
  private readonly translate = inject(TranslateService);
  private readonly cartActions = inject(CartActionsService);
  private readonly auth = inject(AuthTokenService);
  private readonly wishlistActions = inject(WishlistActionsService);

  readonly loadState = signal<ProductDetailLoadState>('idle');
  readonly product = signal<ProductDetail | null>(null);
  readonly variants = signal<ProductDetailVariant[]>([]);
  readonly relatedProducts = signal<ProductCardData[]>([]);
  readonly quantity = signal(1);
  readonly selectedImageIndex = signal(0);
  readonly shareData = signal<PublicProductShareDto | null>(null);

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

  readonly currencyLabel = computed(() => {
    const code = this.currency.displayCode();
    return code || this.translate.instant('PRODUCT_CARD.CURRENCY');
  });

  readonly shareUrl = computed(() => this.shareData()?.url?.trim() ?? '');

  readonly shareMessage = computed(() => {
    const share = this.shareData();
    const p = this.product();
    if (share) {
      const title =
        this.language.currentLang() === 'ar' ? share.titleAr : share.titleEn;
      if (title.trim()) {
        return title.trim();
      }
    }
    if (!p) {
      return '';
    }
    const name = localizedProductName(p, this.language.currentLang());
    const price = `${formatProductPrice(p.price)} ${this.currencyLabel()}`;
    return `${name} — ${price}`;
  });

  readonly shareTitle = computed(() => {
    const share = this.shareData();
    if (share) {
      const title =
        this.language.currentLang() === 'ar' ? share.titleAr : share.titleEn;
      if (title.trim()) {
        return title.trim();
      }
    }
    return this.displayName();
  });

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, query]) => {
        const ref = resolveProductLoadRef(params.get('slug'), query.get('p'));
        if (!ref.productId && !ref.slug) {
          this.loadState.set('not-found');
          this.product.set(null);
          this.shareData.set(null);
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
      this.applyShareSeo();
    });

    this.currency.currencyChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const ref = this.currentRef();
      if (ref.productId || ref.slug) {
        this.loadProduct(ref);
      }
    });
  }

  ngOnDestroy(): void {
    this.productSeo.clearProductShare();
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
    const afterAdd = (): void => {
      if (!this.auth.isLoggedIn()) {
        void this.router.navigate(['/auth/login'], {
          queryParams: { returnUrl: '/checkout/payment' },
        });
        return;
      }
      void this.router.navigate(['/checkout/payment']);
    };
    this.cartActions.addProductDetailThen(p, this.quantity(), afterAdd);
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
    this.shareData.set(null);

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
          this.loadShareInfo(product.id);
        },
        error: () => {
          this.loadState.set('not-found');
        },
      });
  }

  private loadShareInfo(productId: number): void {
    this.productShareInfo
      .getShareInfo(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((info) => {
        this.shareData.set(info?.share ?? null);
        this.applyShareSeo();
      });
  }

  private applyShareSeo(): void {
    const share = this.shareData();
    if (!share) {
      return;
    }
    this.productSeo.applyProductShare(share, this.language.currentLang());
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
