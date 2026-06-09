import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { resultArrayFromAbpEnvelope, resultFromAbpEnvelope } from '../../../core/utils/api-envelope.util';
import type { EcOrderDto } from '../../checkout/models/place-order.model';
import { normalizeOrder } from '../../checkout/utils/checkout-api.mapper';

@Injectable({ providedIn: 'root' })
export class AccountOrdersApiService {
  private readonly http = inject(HttpClient);

  getCustomerOrders(customerId: number): Observable<EcOrderDto[]> {
    const params = new HttpParams().set('customerId', String(customerId));

    return this.http.get<unknown>(ApiEndpoints.EcOrders.getCustomerOrders, { params }).pipe(
      map((res) => this.normalizeOrdersResponse(res)),
      catchError(() => of([])),
    );
  }

  getOrderDetails(orderId: number): Observable<EcOrderDto | null> {
    const params = new HttpParams().set('orderId', String(orderId));

    return this.http.get<unknown>(ApiEndpoints.EcOrders.getOrderDetails, { params }).pipe(
      map((res) => normalizeOrder(resultFromAbpEnvelope(res))),
      catchError(() => of(null)),
    );
  }

  private normalizeOrdersResponse(res: unknown): EcOrderDto[] {
    const direct = resultArrayFromAbpEnvelope<unknown>(res);
    if (direct.length > 0) {
      return direct.map(normalizeOrder).filter((order): order is EcOrderDto => order != null);
    }

    const payload = resultFromAbpEnvelope<unknown>(res);
    if (payload && typeof payload === 'object') {
      const items = (payload as { items?: unknown; Items?: unknown }).items ??
        (payload as { items?: unknown; Items?: unknown }).Items;
      if (Array.isArray(items)) {
        return items.map(normalizeOrder).filter((order): order is EcOrderDto => order != null);
      }
    }

    return [];
  }
}
