import { HttpParams } from '@angular/common/http';
import { modelId } from '../../../shared/utils/product-stock.util';
import type { EcWishlistCommand, EcWishlistContextRequest } from '../models/ec-wishlist.model';

/** Preserve legacy positive-model-only callers; canonical requests retain the product. */
export function toEcWishlistCommandBody(command: EcWishlistCommand): EcWishlistCommand {
  const variant = modelId(command.productVariantId);
  const alias = modelId(command.variantId);
  if (variant && alias && variant !== alias) throw new Error('WISHLIST_INVALID_SELECTION');
  if (!(command.productId && command.productId > 0) && !variant && !alias)
    throw new Error('WISHLIST_INVALID_SELECTION');
  return {
    ...(command.productId && command.productId > 0 ? { productId: command.productId } : {}),
    productVariantId: variant ?? alias,
    ...(command.customerId && command.customerId > 0 ? { customerId: command.customerId } : {}),
    ...(command.currencyId && command.currencyId > 0 ? { currencyId: command.currencyId } : {}),
    ...(command.currencyCode?.trim() ? { currencyCode: command.currencyCode.trim() } : {}),
  };
}
export function buildEcWishlistQueryParams(
  context: EcWishlistContextRequest,
  selection?: EcWishlistCommand,
): HttpParams {
  const values = selection ? toEcWishlistCommandBody({ ...context, ...selection }) : context;
  let params = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    if (value == null || value === '' || value === 0) continue;
    params = params.set(key[0].toUpperCase() + key.slice(1), String(value));
  }
  return params;
}
