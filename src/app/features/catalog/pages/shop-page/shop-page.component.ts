import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import { CatalogPageComponent } from '../catalog-page/catalog-page.component';
import { ProductDetailPageComponent } from '../product-detail-page/product-detail-page.component';

@Component({
  selector: 'app-shop-page',
  imports: [CatalogPageComponent, ProductDetailPageComponent],
  template: `
    @if (isProductDeepLink()) {
      <app-product-detail-page />
    } @else {
      <app-catalog-page />
    }
  `,
})
export class ShopPageComponent {
  private readonly route = inject(ActivatedRoute);

  private readonly productIdQuery = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('p')?.trim() ?? '')),
    { initialValue: '' },
  );

  readonly isProductDeepLink = computed(() => {
    const p = this.productIdQuery();
    return p.length > 0 && /^\d+$/.test(p);
  });
}
