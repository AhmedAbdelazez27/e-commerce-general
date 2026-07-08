import { Component, computed, inject } from '@angular/core';

import { StorefrontProduct } from '../../../../shared/models/storefront-product.model';
import { PortalConfigService } from '../../../../core/portal-config/portal-config.service';
import { resolveHomePageConfig } from '../../../../core/portal-config/portal-home.util';
import { HOME_MOCK_PRODUCTS } from '../../data/home-mock.data';
import { HomeBrandsComponent } from '../../components/home-brands/home-brands.component';
import { HomeCuratedCollectionsComponent } from '../../components/home-curated-collections/home-curated-collections.component';
import { HomeCategoryShortcutsComponent } from '../../components/home-category-shortcuts/home-category-shortcuts.component';
import { HomeHeroComponent } from '../../components/home-hero/home-hero.component';
// Special offers section hidden per request
// import { HomeOffersComponent } from '../../components/home-offers/home-offers.component';
import { HomeProductSectionComponent } from '../../components/home-product-section/home-product-section.component';
import { HomeTrustBadgesComponent } from '../../components/home-trust-badges/home-trust-badges.component';

@Component({
  selector: 'app-home-page',
  imports: [
    HomeHeroComponent,
    HomeCuratedCollectionsComponent,
    HomeCategoryShortcutsComponent,
    HomeProductSectionComponent,
    // HomeOffersComponent,
    HomeBrandsComponent,
    HomeTrustBadgesComponent,
  ],
  templateUrl: './home-page.component.html',
})
export class HomePageComponent {
  private readonly portal = inject(PortalConfigService);

  readonly config = computed(() => resolveHomePageConfig(this.portal.config()));
  readonly data = HOME_MOCK_PRODUCTS;
  readonly trustBadges = computed(() =>
    this.config().trustBadges.filter(
      (badge) => badge.id !== 'returns' || this.portal.enableReturns(),
    ),
  );

  productsForSection(sectionId: string): StorefrontProduct[] {
    switch (sectionId) {
      case 'most-searched':
        return this.data.mostSearched;
      case 'best-sellers':
        return this.data.bestSellers;
      default:
        return [];
    }
  }
}
