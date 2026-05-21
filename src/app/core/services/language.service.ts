import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { APP_ENVIRONMENT } from '../tokens/app-environment.token';

const STORAGE_KEY = 'app_lang';

export type AppLang = 'ar' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly env = inject(APP_ENVIRONMENT);

  initFromStorage(): Promise<unknown> {
    this.translate.addLangs(['en', 'ar']);
    const raw = localStorage.getItem(STORAGE_KEY);
    const lang: AppLang =
      raw === 'ar' || raw === 'en' ? raw : (this.env.defaultLang === 'ar' ? 'ar' : 'en');
    this.applyDom(lang);
    return firstValueFrom(this.translate.use(lang));
  }

  useLanguage(lang: AppLang): Promise<unknown> {
    localStorage.setItem(STORAGE_KEY, lang);
    this.applyDom(lang);
    return firstValueFrom(this.translate.use(lang));
  }

  currentLang(): AppLang {
    const lang = this.translate.getCurrentLang() || this.translate.getFallbackLang();
    return lang === 'ar' ? 'ar' : 'en';
  }

  private applyDom(lang: AppLang): void {
    const dir: 'rtl' | 'ltr' = lang === 'ar' ? 'rtl' : 'ltr';
    const root = document.documentElement;
    root.setAttribute('lang', lang);
    root.setAttribute('dir', dir);
    root.classList.remove('theme-ar', 'theme-en');
    root.classList.add(lang === 'ar' ? 'theme-ar' : 'theme-en');
  }
}
