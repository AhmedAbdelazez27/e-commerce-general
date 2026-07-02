import { Component, OnInit, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

import type { PublicCurrencyDto } from '../../core/models/currency.model';
import { PortalConfigService } from '../../core/portal-config/portal-config.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { AuthTokenService } from '../../core/services/auth-token.service';
import { CartService } from '../../core/services/cart.service';
import { CurrencyService } from '../../core/services/currency.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AppLang, LanguageService } from '../../core/services/language.service';
import { LAYOUT_CONFIG } from '../config/layout.config';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { currencyFromSelectValue, currencyOptionLabel } from '../utils/currency-selector.util';

@Component({
  selector: 'app-store-header',
  imports: [RouterLink, TranslateModule, FormsModule, NotificationBellComponent],
  templateUrl: './store-header.component.html',
})
export class StoreHeaderComponent implements OnInit {
  private readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);
  private readonly auth = inject(AuthTokenService);
  private readonly authSession = inject(AuthSessionService);
  private readonly language = inject(LanguageService);
  private readonly currency = inject(CurrencyService);
  private readonly portal = inject(PortalConfigService);
  private readonly translate = inject(TranslateService);
  private readonly toastr = inject(ToastrService);

  readonly enableReturns = this.portal.enableReturns;

  readonly mobileMenuOpen = input(false);
  readonly openMobileMenu = output<void>();

  readonly config = LAYOUT_CONFIG;
  readonly branding = LAYOUT_CONFIG.branding;
  readonly header = LAYOUT_CONFIG.header;

  readonly itemCount = this.cart.itemCount;
  readonly wishlistCount = this.wishlist.itemCount;
  readonly currencies = this.currency.currencies;
  readonly selectedCurrency = this.currency.selectedCurrency;
  readonly currentLang = () => this.language.currentLang();

  ngOnInit(): void {
    void this.currency.ensureLoaded();
  }

  logoSrc(): string {
    return this.portal.logoSrc();
  }

  logoAlt(): string {
    return this.portal.portalName(this.language.currentLang());
  }

  // searchQuery = '';

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

  setCurrency(currency: PublicCurrencyDto): void {
    this.currency.setCurrency(currency);
    this.toastr.info(this.translate.instant('LAYOUT.HEADER.CURRENCY_CHANGED'));
  }

  onCurrencyIdChange(id: number | null): void {
    if (id == null) {
      return;
    }
    this.applyCurrencyId(String(id));
  }

  private applyCurrencyId(value: string): void {
    const next = currencyFromSelectValue(this.currencies(), value);
    if (!next || next.id === this.selectedCurrency()?.id) {
      return;
    }
    this.setCurrency(next);
  }

  currencyLabel(currency: PublicCurrencyDto): string {
    return currencyOptionLabel(currency, this.language.currentLang());
  }

  showCurrencySelector(): boolean {
    return this.currencies().length > 1;
  }

  // submitSearch(event: Event): void {
  //   event.preventDefault();
  //   const q = this.searchQuery.trim();
  //   void this.router.navigate([this.header.shopRoute], q ? { queryParams: { q } } : undefined);
  // }

  openMenu(): void {
    this.openMobileMenu.emit();
  }

  logout(): void {
    this.authSession.signOut();
  }
}
