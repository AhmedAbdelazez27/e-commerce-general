import { HttpParams } from '@angular/common/http';

import { appendCurrencyToHttpParams } from '../../../core/utils/currency-http-params.util';
import type { EcCartContextRequest } from '../models/cart.model';

/** JSON body for EcCart POST operations (`ClearCart`, etc.). */
export function toEcCartRequestBody(context: EcCartContextRequest): EcCartContextRequest {
  const body: EcCartContextRequest = {
    customerId: context.customerId,
    sessionId: context.sessionId ?? '',
    couponCode: context.couponCode ?? '',
  };

  if (context.currencyId != null && context.currencyId > 0 && context.currencyCode?.trim()) {
    body.currencyId = context.currencyId;
    body.currencyCode = context.currencyCode.trim();
  }

  return body;
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

  if (context.currencyId != null && context.currencyId > 0 && context.currencyCode?.trim()) {
    params = appendCurrencyToHttpParams(params, {
      id: context.currencyId,
      code: context.currencyCode.trim(),
    });
  }

  return params;
}
