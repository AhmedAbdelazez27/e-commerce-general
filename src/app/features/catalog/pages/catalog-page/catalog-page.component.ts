import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { ProductCardData } from '../../../../shared/models/product-card.model';
import { CatalogBreadcrumbComponent } from '../../components/catalog-breadcrumb/catalog-breadcrumb.component';
import { CatalogEmptyStateComponent } from '../../components/catalog-empty-state/catalog-empty-state.component';
import { CatalogFilterPanelComponent } from '../../components/catalog-filter-panel/catalog-filter-panel.component';
import { CatalogListingHeaderComponent } from '../../components/catalog-listing-header/catalog-listing-header.component';
import { CatalogListingToolbarComponent } from '../../components/catalog-listing-toolbar/catalog-listing-toolbar.component';
import { CartActionsService } from '../../../../core/services/cart-actions.service';
import { WishlistActionsService } from '../../../../core/services/wishlist-actions.service';
import { CatalogListingFacade } from '../../services/catalog-listing.facade';
import { navigateToProductDetail } from '../../utils/catalog-navigation.util';
import { mapCatalogProductToCardData } from '../../utils/catalog-product.mapper';

@Component({
  selector: 'app-catalog-page',
  imports: [
    TranslateModule,
    CatalogBreadcrumbComponent,
    CatalogListingHeaderComponent,
    CatalogListingToolbarComponent,
    CatalogFilterPanelComponent,
    CatalogEmptyStateComponent,
    ProductCardComponent,
  ],
  providers: [CatalogListingFacade],
  templateUrl: './catalog-page.component.html',
})
export class CatalogPageComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly cartActions = inject(CartActionsService);
  private readonly wishlistActions = inject(WishlistActionsService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly facade = inject(CatalogListingFacade);

  readonly cardProducts = computed(() =>
    this.facade.filteredProducts().map((p) => mapCatalogProductToCardData(p)),
  );

  ngOnInit(): void {
    this.facade.bootstrap();
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.facade.handleRouteQueryChange();
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.facade.mobileFiltersOpen()) {
      this.facade.closeMobileFilters();
      this.document.body.classList.remove('catalog-filters-open');
    }
  }

  openMobileFilters(): void {
    this.facade.openMobileFilters();
    this.document.body.classList.add('catalog-filters-open');
  }

  closeMobileFilters(): void {
    this.facade.closeMobileFilters();
    this.document.body.classList.remove('catalog-filters-open');
  }

  applyMobileFilters(): void {
    this.facade.applyDraftFilters();
    this.document.body.classList.remove('catalog-filters-open');
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
}
