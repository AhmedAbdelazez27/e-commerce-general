import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../constants/api-endpoints';
import { resultArrayFromAbpEnvelope, resultFromAbpEnvelope } from '../utils/api-envelope.util';
import { FndLookupSelect2Item, FndLookupSelect2Result, FndLookupValueDto } from '../models/fnd-lookup.model';

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

  getAllWithSearch(lookupCode: string, lookupType: string): Observable<FndLookupValueDto[]> {
    const params = new HttpParams().set('lookupCode', lookupCode).set('lookupType', lookupType);

    return this.http.get<unknown>(ApiEndpoints.FndLookupValues.getAllWithSearch, { params }).pipe(
      map((res) =>
        resultArrayFromAbpEnvelope<unknown>(res)
          .map(normalizeLookupValue)
          .filter((item): item is FndLookupValueDto => item != null),
      ),
      catchError(() => of([])),
    );
  }

  getFaqCategories(): Observable<FndLookupValueDto[]> {
    return this.getAllWithSearch('EcFAQs', 'EcFAQsCategory');
  }
}

function normalizeLookupValue(raw: unknown): FndLookupValueDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const id = typeof item['id'] === 'number' ? item['id'] : typeof item['Id'] === 'number' ? item['Id'] : null;
  const nameEn =
    typeof item['nameEn'] === 'string'
      ? item['nameEn']
      : typeof item['NameEn'] === 'string'
        ? item['NameEn']
        : '';
  const nameAr =
    typeof item['nameAr'] === 'string'
      ? item['nameAr']
      : typeof item['NameAr'] === 'string'
        ? item['NameAr']
        : '';
  const lookupCode =
    typeof item['lookupCode'] === 'string'
      ? item['lookupCode']
      : typeof item['LookupCode'] === 'string'
        ? item['LookupCode']
        : '';
  const lookupType =
    typeof item['lookupType'] === 'string'
      ? item['lookupType']
      : typeof item['LookupType'] === 'string'
        ? item['LookupType']
        : '';

  if (id == null) {
    return null;
  }

  const yesNoRaw = item['yesNo'] ?? item['YesNo'];
  const yesNo =
    typeof yesNoRaw === 'boolean' ? yesNoRaw : yesNoRaw === 1 ? true : yesNoRaw === 0 ? false : undefined;

  if (yesNo === false) {
    return null;
  }

  return {
    id,
    nameEn: nameEn.trim(),
    nameAr: nameAr.trim(),
    lookupCode: lookupCode.trim(),
    lookupType: lookupType.trim(),
    yesNo,
  };
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
