import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { resultFromAbpEnvelope } from '../../../core/utils/api-envelope.util';
import { EcCouponDto } from '../models/ec-coupon.model';
import { normalizeEcCouponsPagedResult } from '../utils/ec-coupon-api.mapper';

@Injectable({ providedIn: 'root' })
export class EcCouponsApiService {
  private readonly http = inject(HttpClient);

  getByCode(code: string): Observable<EcCouponDto | null> {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      return of(null);
    }

    const params = new HttpParams()
      .set('Params.Code', normalized)
      .set('MaxResultCount', '1')
      .set('SkipCount', '0');

    return this.http.get<unknown>(ApiEndpoints.EcCoupons.getAll, { params }).pipe(
      map((res) => {
        const payload = resultFromAbpEnvelope<unknown>(res);
        const page = normalizeEcCouponsPagedResult(payload);
        return page.items[0] ?? null;
      }),
      catchError(() => of(null)),
    );
  }
}
