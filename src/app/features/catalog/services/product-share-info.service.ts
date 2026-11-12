import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

import type { PublicProductShareInfoDto } from '../models/product-share-info.model';
import { ProductDetailApiService } from './product-detail-api.service';

@Injectable({ providedIn: 'root' })
export class ProductShareInfoService {
  private readonly api = inject(ProductDetailApiService);
  private readonly cache = new Map<string, Observable<PublicProductShareInfoDto | null>>();

  getShareInfo(productId: number, lang?: string): Observable<PublicProductShareInfoDto | null> {
    if (productId < 1) {
      return of(null);
    }

    const cacheKey = lang?.trim() ? `${productId}:${lang.trim()}` : String(productId);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request$ = this.api.getProductShareInfo(productId, lang).pipe(
      catchError(() => of(null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.cache.set(cacheKey, request$);
    return request$;
  }
}
