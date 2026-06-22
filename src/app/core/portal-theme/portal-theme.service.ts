import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PortalConfiguration } from '../portal-config/portal-configuration.model';
import { AppLang, LanguageService } from '../services/language.service';
import { applyPortalFontFamily, applyPortalThemeToDocument } from './portal-theme-applier';
import { mapPortalConfigurationToTheme } from './portal-theme.mapper';
import { PortalThemeTokens } from './portal-theme.model';

@Injectable({ providedIn: 'root' })
export class PortalThemeService {
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  private themeTokens: PortalThemeTokens | null = null;

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.themeTokens) {
        applyPortalFontFamily(this.themeTokens, this.language.currentLang() as AppLang);
      }
    });
  }

  apply(config: PortalConfiguration): void {
    this.themeTokens = mapPortalConfigurationToTheme(config);
    this.applyTokens(this.themeTokens);
  }

  private applyTokens(tokens: PortalThemeTokens): void {
    applyPortalThemeToDocument(tokens, this.language.currentLang() as AppLang);
  }
}
