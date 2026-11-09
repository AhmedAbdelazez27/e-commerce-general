import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, defer, map } from 'rxjs';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import {
  abpEnvelopeErrorMessage,
  resultFromAbpEnvelope,
} from '../../../core/utils/api-envelope.util';
import type {
  EcWishlistCommand,
  EcWishlistContextRequest,
  EcWishlistDto,
} from '../models/ec-wishlist.model';
import type { CartDto } from '../../cart/models/cart.model';
import { normalizeCartDto } from '../../cart/utils/cart-api.mapper';
import {
  buildEcWishlistQueryParams,
  toEcWishlistCommandBody,
} from '../utils/wishlist-api-params.util';
import { normalizeWishlistDto } from '../utils/wishlist-api.mapper';

function checked(res: unknown): void {
  const message = abpEnvelopeErrorMessage(res);
  const envelope = res as { success?: boolean; Success?: boolean } | null;
  if (message || envelope?.success === false || envelope?.Success === false)
    throw new Error(message ?? 'WISHLIST_REQUEST_FAILED');
}
function payload(res: unknown): unknown {
  checked(res);
  const result = resultFromAbpEnvelope(res) ?? res;
  if (!result || typeof result !== 'object' || !('items' in result || 'Items' in result))
    throw new Error('WISHLIST_RESULT_UNCONFIRMED');
  return result;
}
@Injectable({ providedIn: 'root' })
export class EcWishlistApiService {
  private readonly http = inject(HttpClient);
  getWishlist(context: EcWishlistContextRequest): Observable<EcWishlistDto> {
    return this.http
      .get<unknown>(ApiEndpoints.EcWishlist.getWishlist, {
        params: buildEcWishlistQueryParams(context),
      })
      .pipe(map((res) => normalizeWishlistDto(payload(res))));
  }
  saveProduct(command: EcWishlistCommand): Observable<EcWishlistDto> {
    return defer(() =>
      this.http.post<unknown>(
        ApiEndpoints.EcWishlist.saveProduct,
        toEcWishlistCommandBody(command),
      ),
    ).pipe(map((res) => normalizeWishlistDto(payload(res))));
  }
  remove(command: EcWishlistCommand): Observable<void> {
    return defer(() =>
      this.http.delete<unknown>(ApiEndpoints.EcWishlist.remove, {
        params: buildEcWishlistQueryParams(command, command),
      }),
    ).pipe(
      map((res) => {
        checked(res);
      }),
    );
  }
  moveToCart(command: EcWishlistCommand): Observable<CartDto> {
    return defer(() =>
      this.http.post<unknown>(ApiEndpoints.EcWishlist.moveToCart, toEcWishlistCommandBody(command)),
    ).pipe(map((res) => normalizeCartDto(payload(res))));
  }
}
