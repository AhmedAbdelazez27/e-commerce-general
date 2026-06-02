import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { LanguageService } from '../../core/services/language.service';
import { NavCategory, NavMegaColumn, NavLabelFields } from '../models/layout.model';
import { NavigationService } from '../services/navigation.service';
import { navColumnTitle, navItemLabel } from '../utils/nav-label.util';

@Component({
  selector: 'app-store-nav',
  imports: [RouterLink, TranslateModule],
  templateUrl: './store-nav.component.html',
})
export class StoreNavComponent {
  private readonly navigation = inject(NavigationService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  readonly categories = this.navigation.categories;
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

  label(item: NavLabelFields): string {
    return navItemLabel(item, this.language.currentLang(), (key) => this.translate.instant(key));
  }

  columnTitle(column: NavMegaColumn): string {
    return navColumnTitle(column, this.language.currentLang(), (key) =>
      this.translate.instant(key),
    );
  }
}
