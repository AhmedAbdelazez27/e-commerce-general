import { Router } from '@angular/router';

import { ProductCardData } from '../../../shared/models/product-card.model';
import { productDetailLinkSegment } from './product-detail-api.mapper';

export function navigateToProductDetail(
  router: Router,
  product: Pick<ProductCardData, 'id' | 'slug'>,
): void {
  void router.navigate(['/shop', productDetailLinkSegment(product)]);
}
