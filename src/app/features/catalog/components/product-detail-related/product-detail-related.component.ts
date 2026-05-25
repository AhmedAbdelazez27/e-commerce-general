import { Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { ProductCardData } from '../../../../shared/models/product-card.model';

@Component({
  selector: 'app-product-detail-related',
  imports: [ProductCardComponent, TranslateModule],
  templateUrl: './product-detail-related.component.html',
})
export class ProductDetailRelatedComponent {
  readonly products = input.required<ProductCardData[]>();

  readonly productClick = output<ProductCardData>();
  readonly addToCart = output<ProductCardData>();
  readonly addToWishlist = output<ProductCardData>();
  readonly quickView = output<ProductCardData>();
}
