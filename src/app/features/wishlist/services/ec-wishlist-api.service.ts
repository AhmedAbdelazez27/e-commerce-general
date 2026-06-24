import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { resultFromAbpEnvelope } from '../../../core/utils/api-envelope.util';
import type { EcWishlistCommand, EcWishlistContextRequest, EcWishlistDto } from '../models/ec-wishlist.model';
import { buildEcWishlistQueryParams, toEcWishlistCommandBody } from '../utils/wishlist-api-params.util';
import { normalizeWishlistDto } from '../utils/wishlist-api.mapper';

@Injectable({ providedIn: 'root' })
export class EcWishlistApiService {
  private readonly http = inject(HttpClient);

  getWishlist(context: EcWishlistContextRequest): Observable<EcWishlistDto> {
    if (context.customerId <= 0) {
      return of({ Items: [] });
    }

    const params = buildEcWishlistQueryParams(context);
    return this.http.get<unknown>(ApiEndpoints.EcWishlist.getWishlist, { params }).pipe(
      map((res) => this.normalizeWishlistResponse(res)),
      catchError(() => of({ Items: [] })),
    );
  }

  saveProduct(command: EcWishlistCommand): Observable<boolean> {
    if (command.customerId <= 0 || command.productVariantId <= 0) {
      return of(false);
    }

    return this.http
      .post<unknown>(ApiEndpoints.EcWishlist.saveProduct, toEcWishlistCommandBody(command))
      .pipe(
        map((res) => !!resultFromAbpEnvelope(res)),
        catchError(() => of(false)),
      );
  }

  remove(productVariantId: number, context: EcWishlistContextRequest): Observable<boolean> {
    if (context.customerId <= 0 || productVariantId <= 0) {
      return of(false);
    }

    const params = buildEcWishlistQueryParams(context, { productVariantId });

    return this.http.delete<unknown>(ApiEndpoints.EcWishlist.remove, { params }).pipe(
      map((res) => !!resultFromAbpEnvelope(res)),
      catchError(() => of(false)),
    );
  }

  moveToCart(command: EcWishlistCommand): Observable<boolean> {
    if (command.customerId <= 0 || command.productVariantId <= 0) {
      return of(false);
    }

    return this.http
      .post<unknown>(ApiEndpoints.EcWishlist.moveToCart, toEcWishlistCommandBody(command))
      .pipe(
        map((res) => !!resultFromAbpEnvelope(res)),
        catchError(() => of(false)),
      );
  }

  private normalizeWishlistResponse(res: unknown): EcWishlistDto {
    const payload = resultFromAbpEnvelope<unknown>(res);
    if (payload != null) {
      return normalizeWishlistDto(payload);
    }
    return normalizeWishlistDto(res);
  }
}
