import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin, map, of, switchMap } from 'rxjs';

import { CartActionsService } from '../../../../core/services/cart-actions.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { LanguageService } from '../../../../core/services/language.service';
import { WishlistActionsService } from '../../../../core/services/wishlist-actions.service';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import type { ProductCardData } from '../../../../shared/models/product-card.model';
import type { OfferProduct } from '../../../../shared/models/promotion.model';
import type { PublicFinalPriceDto } from '../../../catalog/models/catalog-public-product.model';
import { ProductDetailApiService } from '../../../catalog/services/product-detail-api.service';
import { navigateToProductDetail } from '../../../catalog/utils/catalog-navigation.util';
import { EcPromotionsApiService } from '../../services/ec-promotions-api.service';

export type BrowsableOfferRole = 'Qualify' | 'Reward' | 'Component';

@Component({
  selector: 'app-offer-product-section',
  imports: [TranslateModule, ProductCardComponent],
  templateUrl: './offer-product-section.component.html',
  styleUrl: './offer-product-section.component.scss',
})
export class OfferProductSectionComponent {
  private readonly api = inject(EcPromotionsApiService);
  private readonly productApi = inject(ProductDetailApiService);
  private readonly router = inject(Router);
  private readonly cartActions = inject(CartActionsService);
  private readonly wishlistActions = inject(WishlistActionsService);
  private readonly language = inject(LanguageService);
  private readonly currency = inject(CurrencyService);
  private readonly pageSize = 8;

  readonly offerId = input.required<number>();
  readonly roleCode = input.required<BrowsableOfferRole>();
  readonly detailId = input<number | undefined>();
  readonly title = input.required<string>();
  readonly description = input('');
  readonly searchable = input(false);

  readonly cardProducts = signal<ProductCardData[]>([]);
  readonly totalCount = signal(0);
  readonly unavailablePriceCount = signal(0);
  readonly skipCount = signal(0);
  readonly searchDraft = signal('');
  readonly appliedSearch = signal('');
  readonly loading = signal(false);
  readonly loadFailed = signal(false);
  readonly pageNumber = computed(() => Math.floor(this.skipCount() / this.pageSize) + 1);
  readonly hasPrevious = computed(() => this.skipCount() > 0);
  readonly hasNext = computed(() => this.skipCount() + this.pageSize < this.totalCount());

  constructor() {
    effect((onCleanup) => {
      const offerId = this.offerId();
      const roleCode = this.roleCode();
      const detailId = this.detailId();
      const skipCount = this.skipCount();
      const searchText = this.appliedSearch();
      const selectedCurrency = this.currency.selectedCurrency() ?? this.currency.selection();
      const lang = this.language.apiCulture();
      if (offerId <= 0) return;

      this.loading.set(true);
      this.loadFailed.set(false);
      this.unavailablePriceCount.set(0);

      const subscription = this.api
        .getOfferProducts({
          offerId,
          roleCode,
          detailId,
          searchText: searchText || undefined,
          skipCount,
          maxResultCount: this.pageSize,
        })
        .pipe(
          switchMap((result) => {
            if (result.items.length === 0) {
              return of({
                totalCount: result.totalCount,
                cards: [] as ProductCardData[],
                failed: 0,
              });
            }

            return forkJoin(
              result.items.map((product) =>
                this.productApi
                  .getFinalPrice(
                    product.productId,
                    product.productVariantId,
                    lang,
                    selectedCurrency,
                  )
                  .pipe(map((price) => (price ? this.toCardProduct(product, price) : null))),
              ),
            ).pipe(
              map((cards) => ({
                totalCount: result.totalCount,
                cards: cards.filter((card): card is ProductCardData => card != null),
                failed: cards.filter((card) => card == null).length,
              })),
            );
          }),
        )
        .subscribe({
          next: (result) => {
            this.cardProducts.set(result.cards);
            this.totalCount.set(result.totalCount);
            this.unavailablePriceCount.set(result.failed);
            this.loading.set(false);
          },
          error: () => {
            this.cardProducts.set([]);
            this.totalCount.set(0);
            this.loadFailed.set(true);
            this.loading.set(false);
          },
        });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  onProductClick(product: ProductCardData): void {
    navigateToProductDetail(this.router, product);
  }

  onAddToCart(product: ProductCardData): void {
    this.cartActions.addProductCard(product);
  }

  onAddToWishlist(product: ProductCardData): void {
    this.wishlistActions.toggle(product);
  }

  onQuickView(product: ProductCardData): void {
    navigateToProductDetail(this.router, product);
  }

  updateSearch(event: Event): void {
    this.searchDraft.set((event.target as HTMLInputElement).value);
  }

  search(): void {
    this.skipCount.set(0);
    this.appliedSearch.set(this.searchDraft().trim());
  }

  previous(): void {
    if (this.hasPrevious()) this.skipCount.update((value) => Math.max(0, value - this.pageSize));
  }

  next(): void {
    if (this.hasNext()) this.skipCount.update((value) => value + this.pageSize);
  }

  private toCardProduct(product: OfferProduct, price: PublicFinalPriceDto): ProductCardData {
    const title =
      product.productNameEn?.trim() || product.productNameAr?.trim() || product.variantSku || '';
    const titleAr =
      product.productNameAr?.trim() || product.productNameEn?.trim() || product.variantSku || '';
    const variantName = product.variantName?.trim();
    const variantSku = product.variantSku?.trim();
    const normalizedVariantName = variantName?.toLocaleLowerCase();
    const repeatsProductName =
      normalizedVariantName === title.toLocaleLowerCase() ||
      normalizedVariantName === titleAr.toLocaleLowerCase();

    return {
      id: product.productId,
      productVariantId: product.productVariantId,
      stock: product.stock,
      title,
      titleAr,
      variantName:
        !repeatsProductName && variantName ? variantName : variantSku ? undefined : undefined,
      variantSku: variantSku || undefined,
      image: product.imageUrl,
      price: price.finalPrice,
      oldPrice: price.basePrice > price.finalPrice ? price.basePrice : undefined,
      isAvailable: product.isAvailable,
      currency: this.currency.displayCode() || undefined,
      offers: price.offers ?? [],
    };
  }
}
