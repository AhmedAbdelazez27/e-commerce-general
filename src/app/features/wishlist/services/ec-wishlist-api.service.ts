import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { resultArrayFromAbpEnvelope, resultFromAbpEnvelope } from '../../../core/utils/api-envelope.util';
import type { ProductCardData } from '../../../shared/models/product-card.model';
import { mapStorefrontProductToCardData } from '../../../shared/utils/product-card.util';
import type { EcWishlistCommand } from '../models/ec-wishlist.model';
import { normalizeWishlistItems } from '../utils/wishlist-api.mapper';

@Injectable({ providedIn: 'root' })
export class EcWishlistApiService {
  private readonly http = inject(HttpClient);

  getWishlist(customerId: number): Observable<ProductCardData[]> {
    if (customerId <= 0) {
      return of([]);
    }

    const params = new HttpParams().set('CustomerId', String(customerId));
    return this.http.get<unknown>(ApiEndpoints.EcWishlist.getWishlist, { params }).pipe(
      map((res) => this.normalizeWishlistResponse(res)),
      catchError(() => of([])),
    );
  }

  saveProduct(command: EcWishlistCommand): Observable<boolean> {
    if (command.customerId <= 0 || command.productVariantId <= 0) {
      return of(false);
    }

    return this.http.post<unknown>(ApiEndpoints.EcWishlist.saveProduct, command).pipe(
      map((res) => !!resultFromAbpEnvelope(res)),
      catchError(() => of(false)),
    );
  }

  remove(productVariantId: number, customerId: number): Observable<boolean> {
    if (customerId <= 0 || productVariantId <= 0) {
      return of(false);
    }

    const params = new HttpParams()
      .set('ProductVariantId', String(productVariantId))
      .set('CustomerId', String(customerId));

    return this.http.delete<unknown>(ApiEndpoints.EcWishlist.remove, { params }).pipe(
      map((res) => !!resultFromAbpEnvelope(res)),
      catchError(() => of(false)),
    );
  }

  moveToCart(command: EcWishlistCommand): Observable<boolean> {
    if (command.customerId <= 0 || command.productVariantId <= 0) {
      return of(false);
    }

    return this.http.post<unknown>(ApiEndpoints.EcWishlist.moveToCart, command).pipe(
      map((res) => !!resultFromAbpEnvelope(res)),
      catchError(() => of(false)),
    );
  }

  private normalizeWishlistResponse(res: unknown): ProductCardData[] {
    const direct = resultArrayFromAbpEnvelope<unknown>(res);
    if (direct.length > 0) {
      return normalizeWishlistItems(direct).map((item) => mapStorefrontProductToCardData(item));
    }

    const payload = resultFromAbpEnvelope<unknown>(res);
    if (payload && typeof payload === 'object') {
      const items = (payload as { items?: unknown; Items?: unknown }).items ??
        (payload as { items?: unknown; Items?: unknown }).Items;
      if (Array.isArray(items)) {
        return normalizeWishlistItems(items).map((item) => mapStorefrontProductToCardData(item));
      }
    }

    return [];
  }
}

