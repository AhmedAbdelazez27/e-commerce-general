import { Router } from '@angular/router';

import { ProductCardData } from '../../../shared/models/product-card.model';
import { productDetailLinkSegment } from './product-detail-api.mapper';

export function navigateToProductDetail(
  router: Router,
  product: Pick<ProductCardData, 'id' | 'slug'>,
): void {
  const slug = product.slug?.trim() || productDetailLinkSegment(product);
  if (slug && !/^\d+$/.test(slug)) {
    void router.navigate(['/shop', slug], { queryParams: { p: product.id } });
    return;
  }

  void router.navigate(['/shop'], { queryParams: { p: product.id } });
}
