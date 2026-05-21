import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthTokenService } from '../../core/services/auth-token.service';
import { AuthProfileService } from '../../core/services/auth-profile.service';
import { CartService } from '../../core/services/cart.service';
import { AuthApiService } from '../../features/auth/services/auth-api.service';
import { AppLang, LanguageService } from '../../core/services/language.service';
import { ShellNavbarComponent } from './shell-navbar/shell-navbar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterOutlet, TranslateModule, ShellNavbarComponent],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent implements OnInit {
  private readonly auth = inject(AuthTokenService);
  private readonly authApi = inject(AuthApiService);
  private readonly authProfile = inject(AuthProfileService);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly language = inject(LanguageService);

  protected readonly authToken = this.auth;

  ngOnInit(): void {
    this.cart.refresh();
  }

  setLang(lang: AppLang): void {
    void this.language.useLanguage(lang);
  }

  protected logout(): void {
    this.authApi.logout().subscribe({
      complete: () => this.finishLogout(),
      error: () => this.finishLogout(),
    });
  }

  private finishLogout(): void {
    this.auth.clearSession();
    this.authProfile.setProfile(null);
    this.cart.clearGuestCart();
    void this.router.navigate(['/home']);
  }
}
