import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { ProductCardData } from '../../../../shared/models/product-card.model';
import { StorefrontProduct } from '../../../../shared/models/storefront-product.model';
import { CartActionsService } from '../../../../core/services/cart-actions.service';
import { LanguageService } from '../../../../core/services/language.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { WishlistActionsService } from '../../../../core/services/wishlist-actions.service';
import { CatalogListingApiService } from '../../../catalog/services/catalog-listing-api.service';
import { navigateToProductDetail } from '../../../catalog/utils/catalog-navigation.util';
import { HomeProductSectionConfig } from '../../models/home.model';
import {
  buildHomeProductSearchRequest,
  mapSearchProductToStorefrontProduct,
  resolveHomeProductSectionLimit,
} from '../../utils/home-product-search.util';
import { productRailEdges, slideProductRail } from '../../utils/home-product-rail.util';
import { mapStorefrontProductToCardData } from '../../../../shared/utils/product-card.util';

@Component({
  selector: 'app-home-best-sellers',
  imports: [ProductCardComponent, SectionHeaderComponent, TranslateModule],
  templateUrl: './home-best-sellers.component.html',
  styleUrl: './home-best-sellers.component.scss',
})
export class HomeBestSellersComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cartActions = inject(CartActionsService);
  private readonly wishlistActions = inject(WishlistActionsService);
  private readonly listingApi = inject(CatalogListingApiService);
  private readonly language = inject(LanguageService);
  private readonly currency = inject(CurrencyService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly section = input.required<HomeProductSectionConfig>();

  readonly loading = signal(false);
  readonly apiProducts = signal<StorefrontProduct[]>([]);

  readonly hasProducts = computed(() => this.apiProducts().length > 0);
  readonly cardProducts = computed(() =>
    this.apiProducts().map((product) => mapStorefrontProductToCardData(product)),
  );

  private readonly rail = viewChild<ElementRef<HTMLElement>>('rail');
  readonly canPrev = signal(false);
  readonly canNext = signal(false);
  readonly sliderOverflow = computed(() => this.canPrev() || this.canNext());

  constructor() {
    effect((onCleanup) => {
      const rail = this.rail()?.nativeElement;
      this.cardProducts();
      if (!rail) {
        return;
      }

      const sync = () => this.syncRail();
      rail.scrollLeft = 0;
      const observer = new ResizeObserver(sync);
      observer.observe(rail);
      const frame = requestAnimationFrame(sync);
      onCleanup(() => {
        cancelAnimationFrame(frame);
        observer.disconnect();
      });
    });
  }

  ngOnInit(): void {
    this.loadFromApi();
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadFromApi());
    this.currency.currencyChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadFromApi());
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

  slide(direction: -1 | 1): void {
    const rail = this.rail()?.nativeElement;
    if (!rail) {
      return;
    }

    slideProductRail(rail, direction, '.home-best-sellers__item');
  }

  syncRail(): void {
    const rail = this.rail()?.nativeElement;
    if (!rail) {
      this.canPrev.set(false);
      this.canNext.set(false);
      return;
    }

    const edges = productRailEdges(rail);
    this.canPrev.set(edges.canPrev);
    this.canNext.set(edges.canNext);
  }

  private loadFromApi(): void {
    const filter = this.section().searchFilter;
    if (!filter) {
      return;
    }

    this.loading.set(true);
    const body = buildHomeProductSearchRequest(
      filter,
      this.language.apiCulture(),
      this.currency.selection(),
      this.section().maxItems,
    );

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
