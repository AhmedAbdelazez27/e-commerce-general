import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { resultFromAbpEnvelope } from '../../../core/utils/api-envelope.util';
import {
  GetProductFiltersParams,
  GetProductFiltersResult,
  SearchProductsRequest,
  SearchProductsResult,
} from '../models/catalog-public-listing.model';

const EMPTY_FILTERS: GetProductFiltersResult = {
  categories: [],
  brands: [],
  priceRange: { minPrice: 0, maxPrice: 0 },
  specifications: [],
  flags: { featured: 0, newArrival: 0, bestSeller: 0 },
};

const EMPTY_SEARCH: SearchProductsResult = {
  totalCount: 0,
  items: [],
};

@Injectable({ providedIn: 'root' })
export class CatalogListingApiService {
  private readonly http = inject(HttpClient);

  getProductFilters(params: GetProductFiltersParams): Observable<GetProductFiltersResult> {
    return this.http
      .get<unknown>(ApiEndpoints.EcPublicCatalog.productFilters, {
        params: this.buildFilterParams(params),
      })
      .pipe(
        map((res) => resultFromAbpEnvelope<GetProductFiltersResult>(res) ?? EMPTY_FILTERS),
        catchError(() => of(EMPTY_FILTERS)),
      );
  }

  searchProducts(body: SearchProductsRequest): Observable<SearchProductsResult> {
    return this.http
      .post<unknown>(ApiEndpoints.EcPublicCatalog.searchProducts, body)
      .pipe(
        map((res) => resultFromAbpEnvelope<SearchProductsResult>(res) ?? EMPTY_SEARCH),
        catchError(() => of(EMPTY_SEARCH)),
      );
  }

  private buildFilterParams(input: GetProductFiltersParams): HttpParams {
    let params = new HttpParams().set(
      'IncludeChildrenCategories',
      String(input.includeChildrenCategories ?? true),
    );

    if (input.lang) {
      params = params.set('Lang', input.lang);
    }
    if (input.searchText?.trim()) {
      params = params.set('SearchText', input.searchText.trim());
    }
    if (input.categoryId != null) {
      params = params.set('CategoryId', String(input.categoryId));
    }
    for (const brandId of input.brandIds ?? []) {
      params = params.append('BrandIds', String(brandId));
    }
    if (input.minPrice != null) {
      params = params.set('MinPrice', String(input.minPrice));
    }
    if (input.maxPrice != null) {
      params = params.set('MaxPrice', String(input.maxPrice));
    }
    params = this.appendSpecificationFilterParams(params, input.specificationFilters ?? []);

    return params;
  }

  private appendSpecificationFilterParams(
    params: HttpParams,
    filters: GetProductFiltersParams['specificationFilters'],
  ): HttpParams {
    for (const [index, filter] of (filters ?? []).entries()) {
      params = params.set(
        `SpecificationFilters[${index}].SpecificationTypeId`,
        String(filter.specificationTypeId),
      );
      for (const value of filter.values ?? []) {
        params = params.append(`SpecificationFilters[${index}].Values`, value);
      }
      if (filter.value) {
        params = params.set(`SpecificationFilters[${index}].Value`, filter.value);
      }
    }
    return params;
  }
}
