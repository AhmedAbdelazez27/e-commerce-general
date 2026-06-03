import { ProductCardData } from '../../../shared/models/product-card.model';
import { resolveDiscountFromCompare } from '../../../shared/utils/product-card.util';
import { CatalogListingProduct } from '../models/catalog-listing.model';
import { productHasOffer } from './catalog-listing-filter.util';

export function mapCatalogProductToCardData(product: CatalogListingProduct): ProductCardData {
  const discountFromCompare = resolveDiscountFromCompare(product.price, product.compareAtPrice);

  return {
    id: product.id,
    slug: product.slug,
    title: product.nameEn,
    titleAr: product.nameAr,
    brand: product.brandNameEn,
    image: product.imageUrl,
    price: product.price,
    oldPrice: product.compareAtPrice,
    discountPercentage: product.discountPercent ?? discountFromCompare,
    rating: product.rating,
    reviewsCount: product.reviewCount,
    isAvailable: product.isAvailable,
    isNew: product.isNew,
    isBestSeller: product.isBestSeller,
  };
}

export function catalogProductOfferFlag(product: CatalogListingProduct): boolean {
  return productHasOffer(product);
}
