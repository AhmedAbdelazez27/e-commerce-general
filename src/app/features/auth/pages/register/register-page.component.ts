import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { AppLang, LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-register-page',
  imports: [TranslateModule],
  template: `
    <div class="container py-5" style="max-width: 28rem">
      <div class="d-flex justify-content-end gap-2 mb-3">
        <button type="button" class="btn btn-sm btn-outline-secondary" (click)="setLang('en')">EN</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" (click)="setLang('ar')">ع</button>
      </div>
      <h1 class="h2">{{ 'PAGE.REGISTER' | translate }}</h1>
    </div>
  `,
})
export class RegisterPageComponent {
  private readonly language = inject(LanguageService);

  setLang(lang: AppLang): void {
    void this.language.useLanguage(lang);
  }
}
