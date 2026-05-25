import { Component, input, output } from '@angular/core';

import { ProductDetailImage } from '../../models/product-detail.model';

@Component({
  selector: 'app-product-gallery',
  templateUrl: './product-gallery.component.html',
})
export class ProductGalleryComponent {
  readonly images = input.required<ProductDetailImage[]>();
  readonly selectedIndex = input(0);
  readonly mainAlt = input.required<string>();
  readonly selectedIndexChange = output<number>();

  selectImage(index: number): void {
    this.selectedIndexChange.emit(index);
  }

  activeImage(): ProductDetailImage {
    return this.images()[this.selectedIndex()] ?? this.images()[0];
  }
}
