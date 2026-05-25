import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthTokenService } from '../../core/services/auth-token.service';
import { CartService } from '../../core/services/cart.service';
import { AppLang, LanguageService } from '../../core/services/language.service';
import { LAYOUT_CONFIG } from '../config/layout.config';
import { NAVIGATION_CATEGORIES } from '../config/navigation.config';
import { NavCategory } from '../models/layout.model';

@Component({
  selector: 'app-mobile-nav-drawer',
  imports: [FormsModule, RouterLink, TranslateModule],
  templateUrl: './mobile-nav-drawer.component.html',
})
export class MobileNavDrawerComponent {
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);
  private readonly auth = inject(AuthTokenService);
  private readonly language = inject(LanguageService);

  readonly open = input(false);
  readonly closed = output<void>();

  readonly categories = NAVIGATION_CATEGORIES;
  readonly header = LAYOUT_CONFIG.header;
  readonly branding = LAYOUT_CONFIG.branding;
  readonly itemCount = this.cart.itemCount;

  searchQuery = '';
  expandedCategoryId: string | null = null;

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.close();
  }

  setLang(lang: AppLang): void {
    void this.language.useLanguage(lang);
  }

  currentLang(): AppLang {
    return this.language.currentLang();
  }

  submitSearch(event: Event): void {
    event.preventDefault();
    const q = this.searchQuery.trim();
    this.close();
    void this.router.navigate([this.header.shopRoute], q ? { queryParams: { q } } : undefined);
  }

  toggleCategory(category: NavCategory): void {
    if (!category.megaMenu?.length) {
      this.close();
      return;
    }
    this.expandedCategoryId = this.expandedCategoryId === category.id ? null : category.id;
  }

  isCategoryExpanded(categoryId: string): boolean {
    return this.expandedCategoryId === categoryId;
  }

  hasMegaMenu(category: NavCategory): boolean {
    return !!category.megaMenu?.length;
  }

  accountRoute(): string {
    return this.auth.isLoggedIn() ? this.header.accountRoute : this.header.loginRoute;
  }

  accountLabelKey(): string {
    return this.auth.isLoggedIn() ? 'LAYOUT.HEADER.ACCOUNT' : 'LAYOUT.HEADER.LOGIN';
  }
}
