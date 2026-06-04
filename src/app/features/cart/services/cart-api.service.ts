import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { dataFromEnvelope, resultFromAbpEnvelope } from '../../../core/utils/api-envelope.util';
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

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly http = inject(HttpClient);

  getEcCart(context: EcCartContextRequest): Observable<CartDto> {
    const params = buildEcCartQueryParams(context);

    return this.http.get<unknown>(ApiEndpoints.EcCart.getCart, { params }).pipe(
      map((res) => {
        const payload = resultFromAbpEnvelope<unknown>(res) ?? dataFromEnvelope<unknown>(res);
        return normalizeCartDto(payload);
      }),
    );
  }

  addToCart(body: EcAddToCartRequest): Observable<CartDto> {
    return this.http.post<unknown>(ApiEndpoints.EcCart.addToCart, body).pipe(
      map((res) => {
        const payload = resultFromAbpEnvelope<unknown>(res) ?? dataFromEnvelope<unknown>(res);
        return normalizeCartDto(payload);
      }),
    );
  }

  updateCart(body: EcUpdateCartRequest): Observable<CartDto> {
    return this.http.put<unknown>(ApiEndpoints.EcCart.updateCart, body).pipe(
      map((res) => {
        const payload = resultFromAbpEnvelope<unknown>(res) ?? dataFromEnvelope<unknown>(res);
        return normalizeCartDto(payload);
      }),
    );
  }

  removeCartItem(
    cartDetailId: number,
    context: EcCartContextRequest,
  ): Observable<void> {
    const params = buildEcCartQueryParams(context, { cartDetailId });

    return this.http.delete<unknown>(ApiEndpoints.EcCart.removeCartItem, { params }).pipe(
      map(() => undefined),
    );
  }

  clearCart(context: EcCartContextRequest): Observable<void> {
    return this.http
      .post<unknown>(ApiEndpoints.EcCart.clearCart, toEcCartRequestBody(context))
      .pipe(map(() => undefined));
  }

  /** @deprecated Legacy cart API — use EcCart methods. */
  getCart(): Observable<CartDto> {
    return this.http.get<unknown>(ApiEndpoints.Cart.get).pipe(
      map((res) => dataFromEnvelope<CartDto>(res) ?? { Items: [] }),
    );
  }

  addItem(body: AddCartItemRequest): Observable<CartDto> {
    return this.http.post<unknown>(ApiEndpoints.Cart.add, body).pipe(
      map((res) => dataFromEnvelope<CartDto>(res) ?? { Items: [] }),
    );
  }

  updateItem(body: UpdateCartItemRequest): Observable<CartDto> {
    return this.http.post<unknown>(ApiEndpoints.Cart.update, body).pipe(
      map((res) => dataFromEnvelope<CartDto>(res) ?? { Items: [] }),
    );
  }

  removeItem(productId: number): Observable<CartDto> {
    return this.http.post<unknown>(ApiEndpoints.Cart.remove, { ProductId: productId }).pipe(
      map((res) => dataFromEnvelope<CartDto>(res) ?? { Items: [] }),
    );
  }
}
