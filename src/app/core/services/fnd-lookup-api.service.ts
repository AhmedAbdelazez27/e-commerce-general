import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../constants/api-endpoints';
import { resultFromAbpEnvelope } from '../utils/api-envelope.util';
import { FndLookupSelect2Item, FndLookupSelect2Result } from '../models/fnd-lookup.model';

const EMPTY_SELECT2: FndLookupSelect2Result = { total: 0, results: [] };

@Injectable({ providedIn: 'root' })
export class FndLookupApiService {
  private readonly http = inject(HttpClient);

  getSelect2(
    type: string,
    lang: string,
    pageSize = 50,
    pageNumber = 1,
  ): Observable<FndLookupSelect2Result> {
    let params = new HttpParams()
      .set('type', type)
      .set('pageSize', String(pageSize))
      .set('pageNumber', String(pageNumber));

    if (lang.trim()) {
      params = params.set('lang', lang);
    }

    return this.http
      .get<unknown>(ApiEndpoints.FndLookupValues.getSelect2, { params })
      .pipe(
        map((res) => normalizeSelect2Result(resultFromAbpEnvelope<unknown>(res))),
        catchError(() => of(EMPTY_SELECT2)),
      );
  }

  getPaymentMethods(lang: string): Observable<FndLookupSelect2Item[]> {
    return this.getSelect2('PaymentMethod', lang).pipe(map((result) => result.results));
  }
}

function normalizeSelect2Result(raw: unknown): FndLookupSelect2Result {
  if (raw == null || typeof raw !== 'object') {
    return EMPTY_SELECT2;
  }

  const payload = raw as Record<string, unknown>;
  const resultsRaw = payload['results'] ?? payload['Results'];
  const results = Array.isArray(resultsRaw)
    ? (resultsRaw.map(normalizeSelect2Item).filter(Boolean) as FndLookupSelect2Item[])
    : [];

  const total =
    typeof payload['total'] === 'number'
      ? payload['total']
      : typeof payload['Total'] === 'number'
        ? payload['Total']
        : results.length;

  return { total, results };
}

function normalizeSelect2Item(raw: unknown): FndLookupSelect2Item | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const id = typeof item['id'] === 'number' ? item['id'] : typeof item['Id'] === 'number' ? item['Id'] : null;
  const text =
    typeof item['text'] === 'string'
      ? item['text']
      : typeof item['Text'] === 'string'
        ? item['Text']
        : '';

  if (id == null || !text.trim()) {
    return null;
  }

  return {
    id,
    text: text.trim(),
    altText:
      typeof item['altText'] === 'string'
        ? item['altText']
        : typeof item['AltText'] === 'string'
          ? item['AltText']
          : null,
    additional:
      typeof item['additional'] === 'string'
        ? item['additional']
        : typeof item['Additional'] === 'string'
          ? item['Additional']
          : null,
    encId:
      typeof item['encId'] === 'string'
        ? item['encId']
        : typeof item['EncId'] === 'string'
          ? item['EncId']
          : null,
  };
}
