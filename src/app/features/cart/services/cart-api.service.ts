import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { dataFromEnvelope } from '../../../core/utils/api-envelope.util';
import { AddCartItemRequest, CartDto, UpdateCartItemRequest } from '../models/cart.model';

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly http = inject(HttpClient);

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
