import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../../core/constants/api-endpoints';
import { resultArrayFromAbpEnvelope } from '../../core/utils/api-envelope.util';
import {
  PublicBrandDto,
  PublicCategoryDto,
  PublicHomeSliderDto,
} from '../models/catalog-public.model';

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
}
