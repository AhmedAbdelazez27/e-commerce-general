import { modelId } from '../../../shared/utils/product-stock.util';
import type { ProductOffers } from '../../../shared/models/promotion.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import {
  abpEnvelopeErrorMessage,
  resultFromAbpEnvelope,
} from '../../../core/utils/api-envelope.util';
import type {
  OfferDefinition,
  OfferLookups,
  OfferProduct,
  PagedResult,
  PublicOfferBadge,
} from '../../../shared/models/promotion.model';
import {
  normalizeOfferBadges,
  normalizeOfferDefinition,
  normalizeOfferLookups,
  normalizeOfferProduct,
  normalizePagedResult,
} from '../../../shared/utils/promotion-api.mapper';

function resultOrThrow(res: unknown): unknown {
  const error = abpEnvelopeErrorMessage(res);
  if (error) throw new Error(error);
  return resultFromAbpEnvelope<unknown>(res);
}

@Injectable({ providedIn: 'root' })
export class EcPromotionsApiService {
  private readonly http = inject(HttpClient);

  getLookups(): Observable<OfferLookups> {
    return this.http
      .get<unknown>(ApiEndpoints.EcPromotions.getLookups)
      .pipe(map((res) => normalizeOfferLookups(resultOrThrow(res))));
  }

  getOffers(skipCount = 0, maxResultCount = 25): Observable<PagedResult<OfferDefinition>> {
    const params = new HttpParams()
      .set('skipCount', String(Math.max(0, skipCount)))
      .set('maxResultCount', String(Math.min(100, Math.max(1, maxResultCount))));
    return this.http
      .get<unknown>(ApiEndpoints.EcPromotions.getOffers, { params })
      .pipe(map((res) => normalizePagedResult(resultOrThrow(res), normalizeOfferDefinition)));
  }

  getOffer(id: number): Observable<OfferDefinition | null> {
    const params = new HttpParams().set('id', String(id));
    return this.http
      .get<unknown>(ApiEndpoints.EcPromotions.getOffer, { params })
      .pipe(map((res) => normalizeOfferDefinition(resultOrThrow(res))));
  }

  getProductOffers(
    productIds: number[],
    productVariantIds: number[] = [],
  ): Observable<ProductOffers[]> {
    return this.http
      .post<unknown>(ApiEndpoints.EcPromotions.getProductOffers, {
        productIds,
        productVariantIds: productVariantIds.filter((id) => modelId(id) != null),
      })
      .pipe(
        map((res) => {
          const payload = resultOrThrow(res);
          if (!Array.isArray(payload)) return [];
          const badges: ProductOffers[] = [];
          for (const row of payload) {
            if (row == null || typeof row !== 'object') continue;
            const o = row as Record<string, unknown>;
            badges.push({
              productId: Number(o['productId'] ?? o['ProductId']),
              productVariantId: modelId(o['productVariantId'] ?? o['ProductVariantId']),
              offers: normalizeOfferBadges(o['offers'] ?? o['Offers']),
            });
          }
          return badges;
        }),
      );
  }

  getOfferProducts(input: {
    offerId: number;
    roleCode?: string;
    detailId?: number;
    searchText?: string;
    inStockOnly?: boolean;
    skipCount?: number;
    maxResultCount?: number;
  }): Observable<PagedResult<OfferProduct>> {
    let params = new HttpParams()
      .set('offerId', String(input.offerId))
      .set('skipCount', String(Math.max(0, input.skipCount ?? 0)))
      .set('maxResultCount', String(Math.min(100, Math.max(1, input.maxResultCount ?? 20))));
    if (input.roleCode) params = params.set('roleCode', input.roleCode);
    if (input.detailId != null) params = params.set('detailId', String(input.detailId));
    if (input.searchText?.trim()) params = params.set('searchText', input.searchText.trim());
    if (input.inStockOnly != null) params = params.set('inStockOnly', String(input.inStockOnly));

    return this.http
      .get<unknown>(ApiEndpoints.EcPromotions.getOfferProducts, { params })
      .pipe(map((res) => normalizePagedResult(resultOrThrow(res), normalizeOfferProduct)));
  }
}
