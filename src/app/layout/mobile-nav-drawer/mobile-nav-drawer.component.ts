import { Component, inject, input, output } from '@angular/core';
// import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthTokenService } from '../../core/services/auth-token.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AppLang, LanguageService } from '../../core/services/language.service';
import { LAYOUT_CONFIG } from '../config/layout.config';
import { LayoutLink, NavCategory, NavMegaColumn, NavLabelFields } from '../models/layout.model';
import { NavigationService } from '../services/navigation.service';
import { navColumnTitle, navItemLabel } from '../utils/nav-label.util';

@Component({
  selector: 'app-mobile-nav-drawer',
  imports: [RouterLink, TranslateModule],
  templateUrl: './mobile-nav-drawer.component.html',
})
export class MobileNavDrawerComponent {
  private readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);
  private readonly auth = inject(AuthTokenService);
  private readonly language = inject(LanguageService);
  private readonly navigation = inject(NavigationService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  readonly open = input(false);
  readonly closed = output<void>();

  readonly categories = this.navigation.categories;
  readonly header = LAYOUT_CONFIG.header;
  readonly branding = LAYOUT_CONFIG.branding;
  readonly utilityNavLinks = LAYOUT_CONFIG.utilityNavLinks;
  readonly itemCount = this.cart.itemCount;
  readonly wishlistCount = this.wishlist.itemCount;

  // searchQuery = '';
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

  label(item: NavLabelFields): string {
    return navItemLabel(item, this.language.currentLang(), (key) => this.translate.instant(key));
  }

  columnTitle(column: NavMegaColumn): string {
    return navColumnTitle(column, this.language.currentLang(), (key) =>
      this.translate.instant(key),
    );
  }

  // submitSearch(event: Event): void {
  //   event.preventDefault();
  //   const q = this.searchQuery.trim();
  //   this.close();
  //   void this.router.navigate([this.header.shopRoute], q ? { queryParams: { q } } : undefined);
  // }

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

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  visibleUtilityLinks(): LayoutLink[] {
    return this.utilityNavLinks.filter((link) => !link.requiresAuth || this.auth.isLoggedIn());
  }

  logout(): void {
    this.auth.clearSession();
    this.cart.refresh();
    this.close();
    void this.router.navigateByUrl('/home');
  }
}
