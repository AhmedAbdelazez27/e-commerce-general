import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../../core/constants/api-endpoints';
import { SKIP_LOADER } from '../../core/http/http-context.tokens';
import { LanguageService } from '../../core/services/language.service';
import { readSearchSuggestionNames } from '../utils/search-suggestions.util';

@Injectable({ providedIn: 'root' })
export class SearchSuggestionsApiService {
  private readonly http = inject(HttpClient);
  private readonly language = inject(LanguageService);

  getSuggestions(searchText: string): Observable<string[]> {
    const params = new HttpParams()
      .set('SearchText', searchText.trim())
      .set('MaxResultCount', '10')
      .set('Lang', this.language.apiCulture());

    return this.http
      .get<unknown>(ApiEndpoints.EcPublicCatalog.searchSuggestions, {
        params,
        context: new HttpContext().set(SKIP_LOADER, true),
      })
      .pipe(
        map((res) => readSearchSuggestionNames(res, this.language.currentLang())),
        catchError(() => of([])),
      );
  }
}
