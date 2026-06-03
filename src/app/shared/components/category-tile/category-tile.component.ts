import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import {
  CATEGORY_PLACEHOLDER_IMAGE,
  resolveCategoryImageUrl,
} from '../../utils/category-image.util';

@Component({
  selector: 'app-category-tile',
  imports: [DecimalPipe, RouterLink, TranslateModule],
  templateUrl: './category-tile.component.html',
})
export class CategoryTileComponent {
  readonly imageUrl = input<string | null>(null);
  readonly name = input.required<string>();
  readonly description = input('');
  readonly count = input(0);
  readonly isFeatured = input(false);
  readonly route = input<string | string[]>(['/shop']);
  readonly queryParams = input<Record<string, string>>();
  /** default = card tile; compact = smaller rail tile; hero = wide featured root */
  readonly variant = input<'default' | 'compact' | 'hero'>('default');

  displayImage(): string {
    return resolveCategoryImageUrl(this.imageUrl());
  }

  isPlaceholder(): boolean {
    return this.displayImage() === CATEGORY_PLACEHOLDER_IMAGE;
  }
}
