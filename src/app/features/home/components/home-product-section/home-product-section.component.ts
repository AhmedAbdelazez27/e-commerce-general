import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { ProductCardData } from '../../../../shared/models/product-card.model';
import { StorefrontProduct } from '../../../../shared/models/storefront-product.model';
import { mapStorefrontProductToCardData } from '../../../../shared/utils/product-card.util';
import { CartActionsService } from '../../../../core/services/cart-actions.service';
import { LanguageService } from '../../../../core/services/language.service';
import { WishlistActionsService } from '../../../../core/services/wishlist-actions.service';
import { CatalogListingApiService } from '../../../catalog/services/catalog-listing-api.service';
import { navigateToProductDetail } from '../../../catalog/utils/catalog-navigation.util';
import { HomeProductSectionConfig } from '../../models/home.model';
import {
  buildHomeProductSearchRequest,
  mapSearchProductToStorefrontProduct,
  resolveHomeProductSectionLimit,
} from '../../utils/home-product-search.util';

@Component({
  selector: 'app-home-product-section',
  imports: [ProductCardComponent, SectionHeaderComponent, TranslateModule],
  templateUrl: './home-product-section.component.html',
})
export class HomeProductSectionComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cartActions = inject(CartActionsService);
  private readonly wishlistActions = inject(WishlistActionsService);
  private readonly listingApi = inject(CatalogListingApiService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  readonly section = input.required<HomeProductSectionConfig>();
  readonly products = input<StorefrontProduct[]>([]);

  readonly loading = signal(false);
  readonly apiProducts = signal<StorefrontProduct[]>([]);

  readonly usesApi = computed(() => !!this.section().searchFilter);
  readonly displayProducts = computed(() =>
    this.usesApi() ? this.apiProducts() : this.products(),
  );
  readonly hasProducts = computed(() => this.displayProducts().length > 0);

  readonly cardProducts = computed(() =>
    this.displayProducts().map((p) => mapStorefrontProductToCardData(p)),
  );

  ngOnInit(): void {
    this.loadFromApi();
    this.translate.onLangChange.subscribe(() => this.loadFromApi());
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

  private loadFromApi(): void {
    const filter = this.section().searchFilter;
    if (!filter) {
      return;
    }

    this.loading.set(true);
    const lang = this.language.apiCulture();
    const body = buildHomeProductSearchRequest(filter, lang, this.section().maxItems);

    this.listingApi
      .searchProducts(body)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          const appLang = this.language.currentLang();
          const limit = resolveHomeProductSectionLimit(this.section().maxItems);
          this.apiProducts.set(
            result.items
              .slice(0, limit)
              .map((item) => mapSearchProductToStorefrontProduct(item, appLang)),
          );
        },
        error: () => {
          this.apiProducts.set([]);
        },
      });
  }
}
