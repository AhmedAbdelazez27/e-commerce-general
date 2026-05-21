import { Injectable } from '@angular/core';
import type { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import ar from './ar.json';
import en from './en.json';

@Injectable()
export class BundledJsonTranslateLoader implements TranslateLoader {
  private readonly dict: Record<string, TranslationObject> = { en, ar };

  getTranslation(lang: string): Observable<TranslationObject> {
    return of(this.dict[lang] ?? {});
  }
}
