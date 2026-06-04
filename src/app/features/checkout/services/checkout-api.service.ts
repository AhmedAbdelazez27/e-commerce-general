import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { resultFromAbpEnvelope } from '../../../core/utils/api-envelope.util';
import type { EcOrderDto, EcPlaceOrderRequest } from '../models/place-order.model';
import { normalizeOrder } from '../utils/checkout-api.mapper';

@Injectable({ providedIn: 'root' })
export class CheckoutApiService {
  private readonly http = inject(HttpClient);

  placeOrder(body: EcPlaceOrderRequest): Observable<EcOrderDto | null> {
    return this.http.post<unknown>(ApiEndpoints.EcCheckout.placeOrder, body).pipe(
      map((res) => normalizeOrder(resultFromAbpEnvelope(res))),
    );
  }
}
