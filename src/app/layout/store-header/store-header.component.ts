import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthTokenService } from '../../core/services/auth-token.service';
import { CartService } from '../../core/services/cart.service';
import { AppLang, LanguageService } from '../../core/services/language.service';
import { LAYOUT_CONFIG } from '../config/layout.config';

@Component({
  selector: 'app-store-header',
  imports: [FormsModule, RouterLink, TranslateModule],
  templateUrl: './store-header.component.html',
})
export class StoreHeaderComponent {
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);
  private readonly auth = inject(AuthTokenService);
  private readonly language = inject(LanguageService);

  readonly mobileMenuOpen = input(false);
  readonly openMobileMenu = output<void>();

  readonly config = LAYOUT_CONFIG;
  readonly branding = LAYOUT_CONFIG.branding;
  readonly header = LAYOUT_CONFIG.header;

  readonly itemCount = this.cart.itemCount;
  readonly currentLang = () => this.language.currentLang();

  searchQuery = '';

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  accountLabel(): string {
    const lang = this.language.currentLang();
    const name = this.auth.getUserDisplayName(lang);
    return name ?? '';
  }

  accountRoute(): string {
    return this.isLoggedIn() ? this.header.accountRoute : this.header.loginRoute;
  }

  accountLabelKey(): string {
    return this.isLoggedIn() ? 'LAYOUT.HEADER.ACCOUNT' : 'LAYOUT.HEADER.LOGIN';
  }

  setLang(lang: AppLang): void {
    void this.language.useLanguage(lang);
  }

  submitSearch(event: Event): void {
    event.preventDefault();
    const q = this.searchQuery.trim();
    void this.router.navigate([this.header.shopRoute], q ? { queryParams: { q } } : undefined);
  }

  openMenu(): void {
    this.openMobileMenu.emit();
  }
}
