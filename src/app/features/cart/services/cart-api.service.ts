import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import {
  abpEnvelopeErrorMessage,
  dataFromEnvelope,
  resultFromAbpEnvelope,
} from '../../../core/utils/api-envelope.util';
import {
  AddCartItemRequest,
  CartDto,
  EcAddToCartRequest,
  EcCartContextRequest,
  EcUpdateCartRequest,
  UpdateCartItemRequest,
} from '../models/cart.model';
import { normalizeCartDto } from '../utils/cart-api.mapper';
import { buildEcCartQueryParams, toEcCartRequestBody } from '../utils/cart-api-params.util';
import type {
  ApplyOfferSelectionRequest,
  OfferRewardCandidate,
  PagedResult,
} from '../../../shared/models/promotion.model';
import {
  normalizeOfferRewardCandidate,
  normalizePagedResult,
} from '../../../shared/utils/promotion-api.mapper';

function cartPayload(res: unknown): unknown {
  const businessError = abpEnvelopeErrorMessage(res);
  if (businessError) throw new Error(businessError);
  const payload = resultFromAbpEnvelope<unknown>(res) ?? dataFromEnvelope<unknown>(res);
  if (!payload || typeof payload !== 'object') throw new Error('CART_RESULT_UNCONFIRMED');
  return payload;
}

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly http = inject(HttpClient);

  getEcCart(context: EcCartContextRequest): Observable<CartDto> {
    const params = buildEcCartQueryParams(context);

    return this.http
      .get<unknown>(ApiEndpoints.EcCart.getCart, { params })
      .pipe(map((res) => normalizeCartDto(cartPayload(res))));
  }

  addToCart(body: EcAddToCartRequest): Observable<CartDto> {
    return this.http
      .post<unknown>(ApiEndpoints.EcCart.addToCart, body)
      .pipe(map((res) => normalizeCartDto(cartPayload(res))));
  }

  updateCart(body: EcUpdateCartRequest): Observable<CartDto> {
    const parse = (res: unknown) => {
      return normalizeCartDto(cartPayload(res));
    };

    // Some deployments expose UpdateCart as POST (not PUT).
    return this.http.put<unknown>(ApiEndpoints.EcCart.updateCart, body).pipe(
      map(parse),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && [404, 405].includes(error.status)) {
          return this.http.post<unknown>(ApiEndpoints.EcCart.updateCart, body).pipe(map(parse));
        }
        return throwError(() => error);
      }),
    );
  }

  getOfferRewards(input: {
    offerId: number;
    customerId?: number;
    sessionId?: string;
    couponCode?: string | null;
    currencyId?: number;
    currencyCode?: string;
    searchText?: string;
    skipCount?: number;
    maxResultCount?: number;
  }): Observable<PagedResult<OfferRewardCandidate>> {
    let params = new HttpParams()
      .set('offerId', String(input.offerId))
      .set('skipCount', String(Math.max(0, input.skipCount ?? 0)))
      .set('maxResultCount', String(Math.min(10, Math.max(1, input.maxResultCount ?? 5))));
    if (input.customerId != null) params = params.set('customerId', String(input.customerId));
    if (input.sessionId) params = params.set('sessionId', input.sessionId);
    if (input.couponCode) params = params.set('couponCode', input.couponCode);
    if (input.currencyId != null) params = params.set('currencyId', String(input.currencyId));
    if (input.currencyCode?.trim()) params = params.set('currencyCode', input.currencyCode.trim());
    if (input.searchText?.trim()) params = params.set('searchText', input.searchText.trim());

    return this.http.get<unknown>(ApiEndpoints.EcCart.getOfferRewards, { params }).pipe(
      map((res) => {
        const businessError = abpEnvelopeErrorMessage(res);
        if (businessError) throw new Error(businessError);
        return normalizePagedResult(resultFromAbpEnvelope(res), normalizeOfferRewardCandidate);
      }),
    );
  }

  applyOfferSelection(body: ApplyOfferSelectionRequest): Observable<CartDto> {
    return this.http
      .post<unknown>(ApiEndpoints.EcCart.applyOfferSelection, body)
      .pipe(map((res) => normalizeCartDto(cartPayload(res))));
  }

  removeCartItem(cartDetailId: number, context: EcCartContextRequest): Observable<void> {
    const params = buildEcCartQueryParams(context, { cartDetailId });

    return this.http.delete<unknown>(ApiEndpoints.EcCart.removeCartItem, { params }).pipe(
      map((res) => {
        const error = abpEnvelopeErrorMessage(res);
        if (error) throw new Error(error);
        return undefined;
      }),
    );
  }

  clearCart(context: EcCartContextRequest): Observable<void> {
    return this.http
      .post<unknown>(ApiEndpoints.EcCart.clearCart, toEcCartRequestBody(context))
      .pipe(map(() => undefined));
  }

  /** @deprecated Legacy cart API — use EcCart methods. */
  getCart(): Observable<CartDto> {
    return this.http
      .get<unknown>(ApiEndpoints.Cart.get)
      .pipe(map((res) => dataFromEnvelope<CartDto>(res) ?? { Items: [] }));
  }

  addItem(body: AddCartItemRequest): Observable<CartDto> {
    return this.http
      .post<unknown>(ApiEndpoints.Cart.add, body)
      .pipe(map((res) => dataFromEnvelope<CartDto>(res) ?? { Items: [] }));
  }

  updateItem(body: UpdateCartItemRequest): Observable<CartDto> {
    return this.http
      .post<unknown>(ApiEndpoints.Cart.update, body)
      .pipe(map((res) => dataFromEnvelope<CartDto>(res) ?? { Items: [] }));
  }

  removeItem(productId: number): Observable<CartDto> {
    return this.http
      .post<unknown>(ApiEndpoints.Cart.remove, { ProductId: productId })
      .pipe(map((res) => dataFromEnvelope<CartDto>(res) ?? { Items: [] }));
  }
}
