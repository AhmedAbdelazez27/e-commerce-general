import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { AppLang, LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-login',
  imports: [TranslateModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly language = inject(LanguageService);

  setLang(lang: AppLang): void {
    void this.language.useLanguage(lang);
  }
}
