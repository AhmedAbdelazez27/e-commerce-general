import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { CartActionsService } from '../../../../core/services/cart-actions.service';
import { WishlistActionsService } from '../../../../core/services/wishlist-actions.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { CatalogBreadcrumbComponent } from '../../../catalog/components/catalog-breadcrumb/catalog-breadcrumb.component';
import { CatalogBreadcrumbItem } from '../../../catalog/models/catalog-listing.model';
import { navigateToProductDetail } from '../../../catalog/utils/catalog-navigation.util';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { ProductCardData } from '../../../../shared/models/product-card.model';
import { WishlistEmptyStateComponent } from '../../components/wishlist-empty-state/wishlist-empty-state.component';

@Component({
  selector: 'app-wishlist-page',
  imports: [
    TranslateModule,
    CatalogBreadcrumbComponent,
    ProductCardComponent,
    WishlistEmptyStateComponent,
  ],
  templateUrl: './wishlist-page.component.html',
})
export class WishlistPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly wishlist = inject(WishlistService);
  private readonly wishlistActions = inject(WishlistActionsService);
  private readonly cartActions = inject(CartActionsService);

  readonly items = this.wishlist.items;
  readonly itemCount = this.wishlist.itemCount;

  readonly breadcrumbs: CatalogBreadcrumbItem[] = [
    { labelKey: 'PAGE.HOME', route: '/home' },
    { labelKey: 'PAGE.WISHLIST', current: true },
  ];

  ngOnInit(): void {
    this.wishlist.refresh();
  }

  isEmpty(): boolean {
    return this.itemCount() === 0;
  }

  onProductClick(product: ProductCardData): void {
    navigateToProductDetail(this.router, product);
  }

  onAddToCart(product: ProductCardData): void {
    // Wishlist UX: "Add to cart" also removes it from wishlist.
    this.wishlistActions.moveToCart(product);
  }

  onAddToWishlist(product: ProductCardData): void {
    this.wishlistActions.toggle(product);
  }

  onQuickView(product: ProductCardData): void {
    navigateToProductDetail(this.router, product);
  }
}
