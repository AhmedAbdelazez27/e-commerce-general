import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../../core/constants/api-endpoints';
import { resultArrayFromAbpEnvelope } from '../../core/utils/api-envelope.util';
import {
  PublicBrandDto,
  PublicCategoryDto,
  PublicFaqDto,
  PublicHomeSliderDto,
  RateFaqRequest,
  SearchFaqsRequest,
} from '../models/catalog-public.model';

function sortPublicFaqs(faqs: PublicFaqDto[]): PublicFaqDto[] {
  return [...faqs].sort((a, b) => a.displayOrder - b.displayOrder);
}

@Injectable({ providedIn: 'root' })
export class EcPublicCatalogApiService {
  private readonly http = inject(HttpClient);

  getCategoriesTree(lang: string): Observable<PublicCategoryDto[]> {
    const params = new HttpParams().set('lang', lang);
    return this.http
      .get<unknown>(ApiEndpoints.EcPublicCatalog.categoriesTree, { params })
      .pipe(
        map((res) => resultArrayFromAbpEnvelope<PublicCategoryDto>(res)),
        catchError(() => of([])),
      );
  }

  getHomeSliders(lang: string): Observable<PublicHomeSliderDto[]> {
    const params = new HttpParams().set('lang', lang);
    return this.http.get<unknown>(ApiEndpoints.EcPublicCatalog.homeSliders, { params }).pipe(
      map((res) => resultArrayFromAbpEnvelope<PublicHomeSliderDto>(res)),
      catchError(() => of([])),
    );
  }

  getBrands(lang: string): Observable<PublicBrandDto[]> {
    const params = new HttpParams().set('lang', lang);
    return this.http.get<unknown>(ApiEndpoints.EcPublicCatalog.brands, { params }).pipe(
      map((res) => resultArrayFromAbpEnvelope<PublicBrandDto>(res)),
      catchError(() => of([])),
    );
  }

  getFaqs(categoryLkpId?: number): Observable<PublicFaqDto[]> {
    let params = new HttpParams();
    if (categoryLkpId != null) {
      params = params.set('categoryLkpId', String(categoryLkpId));
    }
    return this.http.get<unknown>(ApiEndpoints.EcPublicCatalog.getFaqs, { params }).pipe(
      map((res) => sortPublicFaqs(resultArrayFromAbpEnvelope<PublicFaqDto>(res))),
    );
  }

  searchFaqs(body: SearchFaqsRequest): Observable<PublicFaqDto[]> {
    return this.http.post<unknown>(ApiEndpoints.EcPublicCatalog.searchFaqs, body).pipe(
      map((res) => sortPublicFaqs(resultArrayFromAbpEnvelope<PublicFaqDto>(res))),
    );
  }

  rateFaq(body: RateFaqRequest): Observable<void> {
    return this.http.post<unknown>(ApiEndpoints.EcPublicCatalog.rateFaq, body).pipe(map(() => undefined));
  }
}
