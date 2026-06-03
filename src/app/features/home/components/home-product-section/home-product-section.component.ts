import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { ProductCardData } from '../../../../shared/models/product-card.model';
import { StorefrontProduct } from '../../../../shared/models/storefront-product.model';
import { mapStorefrontProductToCardData } from '../../../../shared/utils/product-card.util';
import { CartActionsService } from '../../../../core/services/cart-actions.service';
import { WishlistActionsService } from '../../../../core/services/wishlist-actions.service';
import { navigateToProductDetail } from '../../../catalog/utils/catalog-navigation.util';
import { HomeProductSectionConfig } from '../../models/home.model';

@Component({
  selector: 'app-home-product-section',
  imports: [ProductCardComponent, SectionHeaderComponent],
  templateUrl: './home-product-section.component.html',
})
export class HomeProductSectionComponent {
  private readonly router = inject(Router);
  private readonly cartActions = inject(CartActionsService);
  private readonly wishlistActions = inject(WishlistActionsService);

  readonly section = input.required<HomeProductSectionConfig>();
  readonly products = input.required<StorefrontProduct[]>();

  readonly cardProducts = computed(() =>
    this.products().map((p) => mapStorefrontProductToCardData(p)),
  );

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
}
