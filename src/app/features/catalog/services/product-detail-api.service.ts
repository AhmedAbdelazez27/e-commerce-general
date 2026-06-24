import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import type { CurrencySelection } from '../../../core/models/currency.model';
import { appendCurrencyToHttpParams } from '../../../core/utils/currency-http-params.util';
import { resultArrayFromAbpEnvelope, resultFromAbpEnvelope } from '../../../core/utils/api-envelope.util';
import {
  GetProductDetailsParams,
  PublicFinalPriceDto,
  PublicProductDetailsDto,
  PublicProductImageDto,
  PublicProductSpecificationDto,
  PublicProductVariantDto,
  PublicRelatedProductDto,
} from '../models/catalog-public-product.model';
import { normalizePublicProductDetailsDto } from '../utils/product-detail-api.mapper';

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

  getProductVariants(
    productId: number,
    lang: string,
    currency: CurrencySelection,
  ): Observable<PublicProductVariantDto[]> {
    let params = new HttpParams().set('productId', String(productId)).set('lang', lang);
    params = appendCurrencyToHttpParams(params, currency);
    return this.http
      .get<unknown>(ApiEndpoints.EcPublicCatalog.productVariants, { params })
      .pipe(
        map((res) => resultArrayFromAbpEnvelope<PublicProductVariantDto>(res)),
        catchError(() => of([])),
      );
  }

  getProductImages(productId: number): Observable<PublicProductImageDto[]> {
    const params = new HttpParams().set('productId', String(productId));
    return this.http
      .get<unknown>(ApiEndpoints.EcPublicCatalog.productImages, { params })
      .pipe(
        map((res) => resultArrayFromAbpEnvelope<PublicProductImageDto>(res)),
        catchError(() => of([])),
      );
  }

  getVariantImages(productVariantId: number): Observable<PublicProductImageDto[]> {
    const params = new HttpParams().set('productVariantId', String(productVariantId));
    return this.http
      .get<unknown>(ApiEndpoints.EcPublicCatalog.variantImages, { params })
      .pipe(
        map((res) => resultArrayFromAbpEnvelope<PublicProductImageDto>(res)),
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

    return this.http
      .get<unknown>(ApiEndpoints.EcPublicCatalog.relatedProducts, { params })
      .pipe(
        map((res) => resultArrayFromAbpEnvelope<PublicRelatedProductDto>(res)),
        catchError(() => of([])),
      );
  }

  getFinalPrice(
    productVariantId: number,
    lang: string,
    currency: CurrencySelection,
    quantity = 1,
    couponCode?: string,
  ): Observable<PublicFinalPriceDto | null> {
    let params = new HttpParams()
      .set('ProductVariantId', String(productVariantId))
      .set('Quantity', String(quantity))
      .set('Lang', lang);
    if (couponCode?.trim()) {
      params = params.set('CouponCode', couponCode.trim());
    }
    params = appendCurrencyToHttpParams(params, currency);

    return this.http
      .get<unknown>(ApiEndpoints.EcPublicCatalog.finalPrice, { params })
      .pipe(
        map((res) => resultFromAbpEnvelope<PublicFinalPriceDto>(res)),
        catchError(() => of(null)),
      );
  }
}
