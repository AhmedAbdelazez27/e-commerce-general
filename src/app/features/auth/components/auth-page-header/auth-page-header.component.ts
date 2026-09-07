import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { PortalConfigService } from '../../../../core/portal-config/portal-config.service';
import { AppLang, LanguageService } from '../../../../core/services/language.service';
import { LAYOUT_CONFIG } from '../../../../layout/config/layout.config';

@Component({
  selector: 'app-auth-page-header',
  imports: [RouterLink, TranslateModule],
  templateUrl: './auth-page-header.component.html',
  styleUrl: './auth-page-header.component.scss',
})
export class AuthPageHeaderComponent {
  private readonly language = inject(LanguageService);
  private readonly portal = inject(PortalConfigService);

  readonly branding = LAYOUT_CONFIG.branding;
  readonly header = LAYOUT_CONFIG.header;

  logoSrc(): string {
    return this.portal.logoSrc();
  }

  logoAlt(): string {
    return this.portal.portalName(this.language.currentLang()) || '';
  }

  setLang(lang: AppLang): void {
    void this.language.useLanguage(lang);
  }

  currentLang(): AppLang {
    return this.language.currentLang();
  }
}
