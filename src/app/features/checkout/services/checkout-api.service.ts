import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import {
  abpEnvelopeErrorMessage,
  resultFromAbpEnvelope,
} from '../../../core/utils/api-envelope.util';
import type { EcPlaceOrderRequest, PlaceOrderOutputDto } from '../models/place-order.model';
import type {
  ValidateCouponRequest,
  ValidateCouponResultDto,
} from '../models/validate-coupon.model';
import {
  normalizePlaceOrderOutput,
  normalizeValidateCouponResult,
} from '../utils/checkout-api.mapper';

@Injectable({ providedIn: 'root' })
export class CheckoutApiService {
  private readonly http = inject(HttpClient);

  placeOrder(body: EcPlaceOrderRequest): Observable<PlaceOrderOutputDto | null> {
    return this.http.post<unknown>(ApiEndpoints.EcOrders.placeOrder, body).pipe(
      map((res) => {
        const error = abpEnvelopeErrorMessage(res);
        if (error) throw new Error(error);
        const order = normalizePlaceOrderOutput(resultFromAbpEnvelope(res));
        if (!order) throw new Error('CHECKOUT_UNCERTAIN');
        return order;
      }),
    );
  }

  validateCoupon(body: ValidateCouponRequest): Observable<ValidateCouponResultDto | null> {
    return this.http
      .post<unknown>(ApiEndpoints.EcCheckout.validateCoupon, body)
      .pipe(map((res) => normalizeValidateCouponResult(resultFromAbpEnvelope(res))));
  }
}
