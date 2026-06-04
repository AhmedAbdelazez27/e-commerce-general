import { HttpParams } from '@angular/common/http';

import type { EcCartContextRequest } from '../models/cart.model';

/** JSON body for EcCart POST operations (`ClearCart`, etc.). */
export function toEcCartRequestBody(context: EcCartContextRequest): EcCartContextRequest {
  return {
    customerId: context.customerId,
    sessionId: context.sessionId ?? '',
    couponCode: context.couponCode ?? '',
  };
}

/** Query params for EcCart GET/DELETE operations (PascalCase per Swagger). */
export function buildEcCartQueryParams(
  context: EcCartContextRequest,
  extra?: { cartDetailId?: number },
): HttpParams {
  let params = new HttpParams()
    .set('CustomerId', String(context.customerId))
    .set('SessionId', context.sessionId ?? '')
    .set('CouponCode', context.couponCode ?? '');

  if (extra?.cartDetailId != null && extra.cartDetailId > 0) {
    params = params.set('CartDetailId', String(extra.cartDetailId));
  }

  return params;
}
