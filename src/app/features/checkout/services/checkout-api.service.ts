import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { dataFromEnvelope } from '../../../core/utils/api-envelope.util';

export interface PlaceOrderRequest {
  ShippingAddress: string;
  Notes?: string;
}

export interface PlaceOrderResultDto {
  OrderId: number;
  OrderNumber: string;
}

@Injectable({ providedIn: 'root' })
export class CheckoutApiService {
  private readonly http = inject(HttpClient);

  placeOrder(body: PlaceOrderRequest): Observable<PlaceOrderResultDto | null> {
    return this.http.post<unknown>(ApiEndpoints.Checkout.placeOrder, body).pipe(
      map((res) => dataFromEnvelope<PlaceOrderResultDto>(res)),
    );
  }
}
