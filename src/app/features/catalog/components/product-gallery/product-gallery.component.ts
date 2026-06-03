import { Component, computed, input, output } from '@angular/core';

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

  readonly activeImage = computed(() => {
    const list = this.images();
    if (list.length === 0) {
      return null;
    }
    return list[this.selectedIndex()] ?? list[0];
  });

  selectImage(index: number): void {
    this.selectedIndexChange.emit(index);
  }
}
