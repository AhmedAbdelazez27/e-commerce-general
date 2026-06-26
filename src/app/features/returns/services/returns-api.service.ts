import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { resultFromAbpEnvelope } from '../../../core/utils/api-envelope.util';
import type { EcReturnCreateInput, EcReturnDto, PagedReturnsResult } from '../models/return.model';
import { normalizeEcReturnDto, normalizePagedReturnsResult } from '../utils/returns-api.mapper';

export interface GetCustomerReturnsOptions {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

@Injectable({ providedIn: 'root' })
export class ReturnsApiService {
  private readonly http = inject(HttpClient);

  getCustomerReturns(
    customerId: number,
    options: GetCustomerReturnsOptions = {},
  ): Observable<PagedReturnsResult> {
    let params = new HttpParams()
      .set('Params.CustomerId', String(customerId))
      .set('SkipCount', String(options.skipCount ?? 0))
      .set('MaxResultCount', String(options.maxResultCount ?? 50));

    if (options.sorting?.trim()) {
      params = params.set('Sorting', options.sorting.trim());
    }

    return this.http.get<unknown>(ApiEndpoints.EcReturns.getAll, { params }).pipe(
      map((res) => normalizePagedReturnsResult(resultFromAbpEnvelope(res))),
      catchError(() => of({ totalCount: 0, items: [] })),
    );
  }

  getReturn(id: number): Observable<EcReturnDto | null> {
    const params = new HttpParams().set('Id', String(id));

    return this.http.get<unknown>(ApiEndpoints.EcReturns.getSingle, { params }).pipe(
      map((res) => normalizeEcReturnDto(resultFromAbpEnvelope(res))),
      catchError(() => of(null)),
    );
  }

  createReturn(input: EcReturnCreateInput): Observable<EcReturnDto | null> {
    return this.http.post<unknown>(ApiEndpoints.EcReturns.create, input).pipe(
      map((res) => normalizeEcReturnDto(resultFromAbpEnvelope(res))),
      catchError(() => of(null)),
    );
  }
}
