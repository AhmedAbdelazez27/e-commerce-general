import { Component, computed, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { Model3dViewerComponent } from '../../../../shared/components/model-3d-viewer/model-3d-viewer.component';
import { ProductDetailImage } from '../../models/product-detail.model';

@Component({
  selector: 'app-product-gallery',
  imports: [TranslateModule, Model3dViewerComponent],
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

  playVideo(event: Event): void {
    const video = event.target as HTMLVideoElement;
    video.muted = true;
    void video.play().catch(() => undefined);
  }

  mediaBadge(image: ProductDetailImage): string | null {
    if (image.mediaType === 'Video') {
      return 'PRODUCT_DETAIL.MEDIA_VIDEO';
    }
    if (image.mediaType === 'Model3D') {
      return 'PRODUCT_DETAIL.MEDIA_3D';
    }
    return null;
  }
}
