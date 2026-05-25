import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { NAVIGATION_CATEGORIES } from '../config/navigation.config';
import { NavCategory } from '../models/layout.model';

@Component({
  selector: 'app-store-nav',
  imports: [RouterLink, TranslateModule],
  templateUrl: './store-nav.component.html',
})
export class StoreNavComponent {
  readonly categories = NAVIGATION_CATEGORIES;
  readonly openCategoryId = signal<string | null>(null);

  hasMegaMenu(category: NavCategory): boolean {
    return !!category.megaMenu?.length;
  }

  openMega(categoryId: string): void {
    this.openCategoryId.set(categoryId);
  }

  closeMega(): void {
    this.openCategoryId.set(null);
  }

  isMegaOpen(categoryId: string): boolean {
    return this.openCategoryId() === categoryId;
  }
}
