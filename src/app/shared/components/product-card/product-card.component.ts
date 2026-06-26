import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, of, switchMap } from 'rxjs';

import { ProductShareInfoService } from '../../../features/catalog/services/product-share-info.service';
import { LanguageService } from '../../../core/services/language.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { ProductShareMenuComponent } from '../product-share-menu/product-share-menu.component';
import { ProductCardData } from '../../models/product-card.model';
import {
  formatProductPrice,
  productCardHasDiscount,
  productCardStarSlots,
  resolveProductCardDiscount,
  resolveProductCardTitle,
} from '../../utils/product-card.util';

@Component({
  selector: 'app-product-card',
  imports: [DecimalPipe, TranslateModule, ProductShareMenuComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  private readonly language = inject(LanguageService);
  private readonly currency = inject(CurrencyService);
  private readonly translate = inject(TranslateService);
  private readonly wishlist = inject(WishlistService);
  private readonly productShareInfo = inject(ProductShareInfoService);

  readonly product = input.required<ProductCardData>();
  readonly compact = input(false);

  readonly addToCart = output<ProductCardData>();
  readonly addToWishlist = output<ProductCardData>();
  readonly quickView = output<ProductCardData>();
  readonly productClick = output<ProductCardData>();

  readonly displayTitle = computed(() =>
    resolveProductCardTitle(this.product(), this.language.currentLang()),
  );
  readonly isAvailable = computed(() => this.product().isAvailable !== false);
  readonly hasDiscount = computed(() => productCardHasDiscount(this.product()));
  readonly discountPercent = computed(() => resolveProductCardDiscount(this.product()));
  readonly starSlots = computed(() => productCardStarSlots(this.product().rating));
  readonly showRating = computed(
    () => this.product().rating != null || (this.product().reviewsCount ?? 0) > 0,
  );
  readonly currencyLabel = computed(() => {
    const fromProduct = this.product().currency?.trim();
    if (fromProduct) {
      return fromProduct;
    }
    const selected = this.currency.displayCode();
    if (selected) {
      return selected;
    }
    return this.translate.instant('PRODUCT_CARD.CURRENCY');
  });
  readonly inWishlist = computed(() => {
    this.wishlist.items();
    const product = this.product();
    const variantId = product.productVariantId;
    if (variantId != null && variantId > 0) {
      return this.wishlist.isInWishlistVariant(variantId);
    }
    return this.wishlist.isInWishlist(product.id);
  });
  readonly wishlistLabelKey = computed(() =>
    this.inWishlist() ? 'PRODUCT_CARD.REMOVE_WISHLIST' : 'PRODUCT_CARD.ADD_WISHLIST',
  );

  private readonly shareData = toSignal(
    toObservable(this.product).pipe(
      switchMap((product) =>
        product.id > 0 ? this.productShareInfo.getShareInfo(product.id) : of(null),
      ),
      map((info) => info?.share ?? null),
    ),
    { initialValue: null },
  );

  readonly shareUrl = computed(() => this.shareData()?.url?.trim() ?? '');

  readonly shareMessage = computed(() => {
    const share = this.shareData();
    if (share) {
      const title =
        this.language.currentLang() === 'ar' ? share.titleAr : share.titleEn;
      if (title.trim()) {
        return title.trim();
      }
    }
    const product = this.product();
    return `${this.displayTitle()} — ${formatProductPrice(product.price)} ${this.currencyLabel()}`;
  });

  onProductClick(): void {
    this.productClick.emit(this.product());
  }

  onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isAvailable()) {
      return;
    }
    this.addToCart.emit(this.product());
  }

  onAddToWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.addToWishlist.emit(this.product());
  }

  onQuickView(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.quickView.emit(this.product());
  }

  formatPrice(value: number): string {
    return formatProductPrice(value);
  }
}
