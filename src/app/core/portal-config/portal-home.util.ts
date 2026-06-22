import { HOME_PAGE_CONFIG } from '../../features/home/config/home.config';
import { HomePageConfig } from '../../features/home/models/home.model';
import { resolveHomeProductSectionLimit } from '../../features/home/utils/home-product-search.util';
import { PortalConfiguration } from './portal-configuration.model';

/** Apply portal visibility flags and section counts over static home config. */
export function resolveHomePageConfig(portal: PortalConfiguration): HomePageConfig {
  const base = HOME_PAGE_CONFIG;

  const curatedCollections =
    portal.showFeaturedProducts && base.curatedCollections
      ? {
          ...base.curatedCollections,
          maxItems: resolveHomeProductSectionLimit(portal.featuredProductsCount),
        }
      : undefined;

  const productSections = base.productSections
    .filter((section) => {
      if (section.id === 'best-sellers') {
        return portal.showBestSellers;
      }
      if (section.id === 'new-arrivals') {
        return portal.showNewArrivals;
      }
      return true;
    })
    .map((section) => {
      if (section.id === 'best-sellers') {
        return {
          ...section,
          maxItems: resolveHomeProductSectionLimit(portal.bestSellerCount),
        };
      }
      if (section.id === 'new-arrivals') {
        return {
          ...section,
          maxItems: resolveHomeProductSectionLimit(portal.newArrivalCount),
        };
      }
      return section;
    });

  return {
    ...base,
    curatedCollections,
    productSections,
  };
}
