import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { ProductCardData } from '../../../../shared/models/product-card.model';
import { StorefrontProduct } from '../../../../shared/models/storefront-product.model';
import { mapStorefrontProductToCardData } from '../../../../shared/utils/product-card.util';
import { HomeProductSectionConfig } from '../../models/home.model';

@Component({
  selector: 'app-home-product-section',
  imports: [ProductCardComponent, SectionHeaderComponent],
  templateUrl: './home-product-section.component.html',
})
export class HomeProductSectionComponent {
  private readonly router = inject(Router);

  readonly section = input.required<HomeProductSectionConfig>();
  readonly products = input.required<StorefrontProduct[]>();

  readonly cardProducts = computed(() =>
    this.products().map((p) => mapStorefrontProductToCardData(p)),
  );

  onProductClick(product: ProductCardData): void {
    void this.router.navigate(['/shop', product.id]);
  }

  onAddToCart(_product: ProductCardData): void {
    // Wire to CartService when add-to-cart API is ready
  }

  onAddToWishlist(_product: ProductCardData): void {
    // Wire to wishlist when available
  }

  onQuickView(_product: ProductCardData): void {
    // Wire to quick-view modal when available
  }
}
