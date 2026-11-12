import {
  requiresModel,
  stockStatus,
  validQuantity,
} from '../../../../shared/utils/product-stock.util';
import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { combineLatest } from 'rxjs';

import { ProductSeoService } from '../../../../core/portal-seo/product-seo.service';
import { CartActionsService } from '../../../../core/services/cart-actions.service';
import { AuthTokenService } from '../../../../core/services/auth-token.service';
import { ToastService } from '../../../../core/services/toast.service';
import { WishlistActionsService } from '../../../../core/services/wishlist-actions.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { LanguageService } from '../../../../core/services/language.service';
import { ProductCardData } from '../../../../shared/models/product-card.model';
import { OfferBadgeListComponent } from '../../../../shared/components/offer-badge-list/offer-badge-list.component';
import { ProductShareMenuComponent } from '../../../../shared/components/product-share-menu/product-share-menu.component';
import { formatProductPrice } from '../../../../shared/utils/product-card.util';
import { CatalogBreadcrumbComponent } from '../../components/catalog-breadcrumb/catalog-breadcrumb.component';
import { ProductDetailInfoComponent } from '../../components/product-detail-info/product-detail-info.component';
import { ProductDetailRelatedComponent } from '../../components/product-detail-related/product-detail-related.component';
import { ProductGalleryComponent } from '../../components/product-gallery/product-gallery.component';
import {
  ProductDetail,
  ProductDetailLoadState,
  ProductDetailVariant,
} from '../../models/product-detail.model';
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
  localizedShortDescription,
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
    OfferBadgeListComponent,
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
  private readonly toast = inject(ToastService);

  readonly loadState = signal<ProductDetailLoadState>('idle');
  readonly product = signal<ProductDetail | null>(null);
  readonly variants = signal<ProductDetailVariant[]>([]);
  readonly relatedProducts = signal<ProductCardData[]>([]);
  readonly quantity = signal(1);
  readonly selectionBusy = signal(false);
  readonly priceBusy = signal(false);
  private selectionSequence = 0;
  private loadSequence = 0;
  private priceSequence = 0;
  readonly requiresModel = requiresModel;
  readonly stockStatus = stockStatus;
  readonly canBuy = computed(() => {
    const p = this.product();
    return (
      !!p &&
      p.isAvailable &&
      !this.selectionBusy() &&
      !this.priceBusy() &&
      this.quantityValidationKey() !== 'INVENTORY.INVALID_QUANTITY' &&
      (!requiresModel(p.stock) || !!p.productVariantId)
    );
  });
  readonly quantityValidationKey = signal<string | null>(null);
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
    return p.stock?.allowOnlineBackorder
      ? Number.MAX_SAFE_INTEGER
      : Math.max(0.01, p.stockQuantity);
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
      const title = this.language.currentLang() === 'ar' ? share.titleAr : share.titleEn;
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
      const title = this.language.currentLang() === 'ar' ? share.titleAr : share.titleEn;
      if (title.trim()) {
        return title.trim();
      }
    }
    return this.displayName();
  });

  ngOnInit(): void {
    this.cartActions.availabilityRefreshed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const p = this.product();
        if (
          !p ||
          this.selectionBusy() ||
          p.id !== value.productId ||
          (p.productVariantId ?? null) !== value.productVariantId
        )
          return;
        this.product.set({
          ...p,
          stock: value.stock,
          stockQuantity: value.stock?.available ?? 0,
          isAvailable: value.isAvailable,
        });
      });
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

  shortDescription(): string {
    const p = this.product();
    return p ? localizedShortDescription(p, this.language.currentLang()) : '';
  }

  brandQueryParams(): Record<string, string> | undefined {
    const p = this.product();
    return p?.brandId ? { brand: p.brandId } : undefined;
  }

  formatPrice(value: number): string {
    return formatProductPrice(value);
  }

  decrementQuantity(): void {
    this.applyQuantity(this.quantity() - 1);
  }

  incrementQuantity(): void {
    const max = this.maxQuantity();
    if (this.quantity() >= max) {
      this.quantityValidationKey.set('PRODUCT_DETAIL.STOCK_MAX_REACHED');
      return;
    }
    this.applyQuantity(this.quantity() + 1);
  }

  onQuantityInput(event: Event): void {
    const raw = Number((event.target as HTMLInputElement).value);
    const requested = Number.isFinite(raw) ? raw : 1;
    this.applyQuantity(requested, requested);
  }

  onVariantSelect(variantId: number): void {
    const product = this.product();
    const variant = this.variants().find((entry) => entry.id === variantId);
    if (
      !product ||
      !variant ||
      (product.selectedVariantId === variantId && !this.selectionBusy())
    ) {
      return;
    }

    const sequence = ++this.selectionSequence;
    ++this.priceSequence;
    this.priceBusy.set(false);
    this.selectionBusy.set(true);
    this.productDetailService
      .selectVariant(product, variant, this.quantity())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          if (sequence !== this.selectionSequence) return;
          this.product.set(updated);
          this.selectedImageIndex.set(0);
          this.selectionBusy.set(false);
          this.clampQuantityToStock();
        },
        error: () => {
          if (sequence === this.selectionSequence) {
            this.selectionBusy.set(false);
            this.product.update((p) => (p ? { ...p, isAvailable: false } : p));
          }
        },
      });
  }

  addToCart(): void {
    const p = this.product();
    if (!p || !this.canBuy()) {
      return;
    }
    if (!this.validateQuantityForAction()) {
      return;
    }
    this.cartActions.addProductDetail(p, this.quantity());
  }

  buyNow(): void {
    const p = this.product();
    if (!p) {
      return;
    }
    if (!this.validateQuantityForAction()) {
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
    const sequence = ++this.loadSequence;
    ++this.selectionSequence;
    ++this.priceSequence;
    this.selectionBusy.set(false);
    this.priceBusy.set(false);
    this.loadState.set('loading');
    this.product.set(null);
    this.variants.set([]);
    this.quantity.set(1);
    this.quantityValidationKey.set(null);
    this.selectedImageIndex.set(0);
    this.shareData.set(null);

    this.productDetailService
      .load(ref)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ product, variants, related }) => {
          if (sequence !== this.loadSequence) return;
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
          this.applyShareSeo();
          this.loadShareInfo(product.id, sequence);
        },
        error: () => {
          if (sequence !== this.loadSequence) return;
          this.loadState.set('not-found');
        },
      });
  }

  private loadShareInfo(productId: number, sequence: number): void {
    const lang = this.language.apiCulture();
    this.productShareInfo
      .getShareInfo(productId, lang)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((info) => {
        if (sequence !== this.loadSequence || this.language.apiCulture() !== lang) return;
        if (this.product()?.id !== productId) return;
        this.shareData.set(info?.share ?? null);
        this.applyShareSeo();
      });
  }

  private applyShareSeo(): void {
    const product = this.product();
    if (!product && !this.shareData()) {
      return;
    }
    this.productSeo.applyProductPage(this.shareData(), this.language.currentLang(), product);
  }

  private refreshDisplayedPrice(): void {
    const product = this.product();
    if (!product || this.selectionBusy()) {
      return;
    }

    const sequence = ++this.priceSequence;
    this.priceBusy.set(true);
    this.productDetailService
      .refreshPrice(product, this.quantity())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updated) => {
        if (sequence === this.priceSequence) {
          this.product.set(updated);
          this.priceBusy.set(false);
        }
      });
  }

  private applyQuantity(next: number, requested?: number): void {
    const max = this.maxQuantity();
    if (!validQuantity(next, this.product()?.stock)) {
      this.quantityValidationKey.set('INVENTORY.INVALID_QUANTITY');
      return;
    }
    const clamped = Math.min(max, Math.max(0.01, next));
    this.quantity.set(clamped);

    if (requested != null && requested > max) {
      this.quantityValidationKey.set('PRODUCT_DETAIL.STOCK_EXCEEDED');
    } else if (next > max) {
      this.quantityValidationKey.set('PRODUCT_DETAIL.STOCK_MAX_REACHED');
    } else {
      this.quantityValidationKey.set(null);
    }

    this.refreshDisplayedPrice();
  }

  private clampQuantityToStock(): void {
    const max = this.maxQuantity();
    if (this.quantity() > max) {
      this.applyQuantity(max, this.quantity());
    }
  }

  private validateQuantityForAction(): boolean {
    if (!validQuantity(this.quantity(), this.product()?.stock)) return false;
    const max = this.maxQuantity();
    if (this.quantity() > max) {
      this.quantityValidationKey.set('PRODUCT_DETAIL.STOCK_EXCEEDED');
      this.toast.warning(this.translate.instant('PRODUCT_DETAIL.STOCK_EXCEEDED', { count: max }));
      return false;
    }
    return true;
  }
}
