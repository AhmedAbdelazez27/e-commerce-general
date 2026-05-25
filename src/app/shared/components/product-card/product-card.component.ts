import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { LanguageService } from '../../../core/services/language.service';
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
  imports: [DecimalPipe, TranslateModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);

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
  readonly currencyLabel = computed(
    () => this.product().currency ?? this.translate.instant('PRODUCT_CARD.CURRENCY'),
  );

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
