import type { ProductAvailability } from '../../../shared/models/product-stock.model';
import {
  modelId,
  normalizeStock,
  canPurchase,
  stockStatus,
} from '../../../shared/utils/product-stock.util';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import type { CurrencySelection } from '../../../core/models/currency.model';
import { appendCurrencyToHttpParams } from '../../../core/utils/currency-http-params.util';
import {
  resultArrayFromAbpEnvelope,
  resultFromAbpEnvelope,
} from '../../../core/utils/api-envelope.util';
import {
  GetProductDetailsParams,
  PublicFinalPriceDto,
  PublicProductDetailsDto,
  PublicProductImageDto,
  PublicProductSpecificationDto,
  PublicProductVariantDto,
  PublicRelatedProductDto,
} from '../models/catalog-public-product.model';
import type { PublicProductShareInfoDto } from '../models/product-share-info.model';
import {
  normalizePublicFinalPriceDto,
  normalizePublicProductDetailsDto,
  normalizePublicProductVariantDto,
  normalizePublicRelatedProductDto,
} from '../utils/product-detail-api.mapper';
import { normalizePublicProductImageList } from '../utils/catalog-media.util';
import { normalizeProductShareInfoDto } from '../utils/product-share-info-api.mapper';

@Injectable({ providedIn: 'root' })
export class ProductDetailApiService {
  private readonly http = inject(HttpClient);

  getProductDetails(params: GetProductDetailsParams): Observable<PublicProductDetailsDto | null> {
    let httpParams = new HttpParams();
    if (params.lang) {
      httpParams = httpParams.set('Lang', params.lang);
    }
    if (params.productId != null && params.productId > 0) {
      httpParams = httpParams.set('ProductId', String(params.productId));
    }
    if (params.slug?.trim()) {
      httpParams = httpParams.set('Slug', params.slug.trim());
    }
    if (params.currencyId != null && params.currencyId > 0 && params.currencyCode?.trim()) {
      httpParams = appendCurrencyToHttpParams(httpParams, {
        id: params.currencyId,
        code: params.currencyCode.trim(),
      });
    }

    return this.http
      .get<unknown>(ApiEndpoints.EcPublicCatalog.productDetails, { params: httpParams })
      .pipe(
        map((res) => {
          const raw = resultFromAbpEnvelope<unknown>(res);
          return raw ? normalizePublicProductDetailsDto(raw) : null;
        }),
        catchError(() => of(null)),
      );
  }

  getProductShareInfo(
    productId: number,
    lang?: string,
  ): Observable<PublicProductShareInfoDto | null> {
    let params = new HttpParams().set('ProductId', String(productId));
    if (lang?.trim()) {
      params = params.set('Lang', lang.trim());
    }
    return this.http.get<unknown>(ApiEndpoints.EcPublicCatalog.productShareInfo, { params }).pipe(
      map((res) => {
        const raw = resultFromAbpEnvelope<unknown>(res);
        return raw ? normalizeProductShareInfoDto(raw) : null;
      }),
      catchError(() => of(null)),
    );
  }

  getProductVariants(
    productId: number,
    lang: string,
    currency: CurrencySelection,
  ): Observable<PublicProductVariantDto[]> {
    let params = new HttpParams().set('productId', String(productId)).set('lang', lang);
    params = appendCurrencyToHttpParams(params, currency);
    return this.http.get<unknown>(ApiEndpoints.EcPublicCatalog.productVariants, { params }).pipe(
      map((res) =>
        resultArrayFromAbpEnvelope<unknown>(res)
          .map(normalizePublicProductVariantDto)
          .filter((item): item is PublicProductVariantDto => item != null),
      ),
      catchError(() => of([])),
    );
  }

  getProductImages(productId: number): Observable<PublicProductImageDto[]> {
    const params = new HttpParams().set('productId', String(productId));
    return this.http.get<unknown>(ApiEndpoints.EcPublicCatalog.productImages, { params }).pipe(
      map((res) => normalizePublicProductImageList(resultArrayFromAbpEnvelope<unknown>(res))),
      catchError(() => of([])),
    );
  }

  getVariantImages(productVariantId: number): Observable<PublicProductImageDto[]> {
    const params = new HttpParams().set('productVariantId', String(productVariantId));
    return this.http.get<unknown>(ApiEndpoints.EcPublicCatalog.variantImages, { params }).pipe(
      map((res) => normalizePublicProductImageList(resultArrayFromAbpEnvelope<unknown>(res))),
      catchError(() => of([])),
    );
  }

  getProductSpecifications(
    productId: number,
    lang: string,
    productVariantId?: number | null,
  ): Observable<PublicProductSpecificationDto[]> {
    let params = new HttpParams().set('productId', String(productId)).set('lang', lang);
    if (productVariantId != null && productVariantId > 0) {
      params = params.set('productVariantId', String(productVariantId));
    }
    return this.http
      .get<unknown>(ApiEndpoints.EcPublicCatalog.productSpecifications, { params })
      .pipe(
        map((res) => resultArrayFromAbpEnvelope<PublicProductSpecificationDto>(res)),
        catchError(() => of([])),
      );
  }

  getRelatedProducts(
    productId: number,
    lang: string,
    currency: CurrencySelection,
    maxResultCount = 8,
  ): Observable<PublicRelatedProductDto[]> {
    let params = new HttpParams()
      .set('productId', String(productId))
      .set('lang', lang)
      .set('maxResultCount', String(maxResultCount > 0 ? maxResultCount : 8));
    params = appendCurrencyToHttpParams(params, currency);

    return this.http.get<unknown>(ApiEndpoints.EcPublicCatalog.relatedProducts, { params }).pipe(
      map((res) =>
        resultArrayFromAbpEnvelope<unknown>(res)
          .map(normalizePublicRelatedProductDto)
          .filter((item): item is PublicRelatedProductDto => item != null),
      ),
      catchError(() => of([])),
    );
  }

  getProductAvailability(
    productId: number,
    productVariantId: number | null = null,
  ): Observable<ProductAvailability> {
    let params = new HttpParams().set('productId', String(productId));
    if (modelId(productVariantId))
      params = params.set('productVariantId', String(productVariantId));
    return this.http
      .get<unknown>(ApiEndpoints.EcPublicCatalog.productAvailability, { params })
      .pipe(
        map((res) => {
          const raw = resultFromAbpEnvelope<Record<string, unknown>>(res);
          if (!raw) throw new Error('Availability unavailable');
          const stock = normalizeStock(raw['stock'] ?? raw['Stock']);
          const status = (raw['availabilityStatus'] ?? raw['AvailabilityStatus']) as string;
          return {
            productId,
            productVariantId: modelId(productVariantId),
            stock,
            isAvailable: canPurchase(stock, status),
            availabilityStatus: stockStatus(stock, status),
          };
        }),
      );
  }

  getFinalPrice(
    productId: number,
    productVariantId: number | null,
    lang: string,
    currency: CurrencySelection,
    quantity = 1,
    couponCode?: string,
  ): Observable<PublicFinalPriceDto | null> {
    let params = new HttpParams()
      .set('ProductId', String(productId))
      .set('Quantity', String(quantity))
      .set('Lang', lang);
    if (modelId(productVariantId) != null)
      params = params.set('ProductVariantId', String(productVariantId));
    if (couponCode?.trim()) {
      params = params.set('CouponCode', couponCode.trim());
    }
    params = appendCurrencyToHttpParams(params, currency);

    return this.http.get<unknown>(ApiEndpoints.EcPublicCatalog.finalPrice, { params }).pipe(
      map((res) => normalizePublicFinalPriceDto(resultFromAbpEnvelope<unknown>(res))),
      catchError(() => of(null)),
    );
  }
}
