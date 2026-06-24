import { HttpParams } from '@angular/common/http';

import { appendCurrencyToHttpParams } from '../../../core/utils/currency-http-params.util';
import type { EcWishlistCommand, EcWishlistContextRequest } from '../models/ec-wishlist.model';

/** JSON body for EcWishlist POST operations (`SaveProduct`, `MoveToCart`, etc.). */
export function toEcWishlistCommandBody(command: EcWishlistCommand): EcWishlistCommand {
  const body: EcWishlistCommand = {
    productVariantId: command.productVariantId,
    customerId: command.customerId,
  };

  if (command.currencyId != null && command.currencyId > 0 && command.currencyCode?.trim()) {
    body.currencyId = command.currencyId;
    body.currencyCode = command.currencyCode.trim();
  }

  return body;
}

/** Query params for EcWishlist GET/DELETE operations (PascalCase per Swagger). */
export function buildEcWishlistQueryParams(
  context: EcWishlistContextRequest,
  extra?: { productVariantId?: number },
): HttpParams {
  let params = new HttpParams().set('CustomerId', String(context.customerId));

  if (extra?.productVariantId != null && extra.productVariantId > 0) {
    params = params.set('ProductVariantId', String(extra.productVariantId));
  }

  if (context.currencyId != null && context.currencyId > 0 && context.currencyCode?.trim()) {
    params = appendCurrencyToHttpParams(params, {
      id: context.currencyId,
      code: context.currencyCode.trim(),
    });
  }

  return params;
}
