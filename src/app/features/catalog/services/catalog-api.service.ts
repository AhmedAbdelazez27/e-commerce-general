import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { dataArrayFromEnvelope, dataFromEnvelope } from '../../../core/utils/api-envelope.util';
import { CategoryDto, ProductDetailDto, ProductListItemDto } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly http = inject(HttpClient);

  getProducts(search?: string, categoryId?: number): Observable<ProductListItemDto[]> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    if (categoryId != null) {
      params = params.set('categoryId', String(categoryId));
    }

    return this.http.get<unknown>(ApiEndpoints.Catalog.products, { params }).pipe(
      map((res) => dataArrayFromEnvelope<ProductListItemDto>(res)),
      catchError(() => of(this.demoProducts())),
    );
  }

  getProductById(id: number): Observable<ProductDetailDto | null> {
    const params = new HttpParams().set('id', String(id));
    return this.http.get<unknown>(ApiEndpoints.Catalog.productById, { params }).pipe(
      map((res) => dataFromEnvelope<ProductDetailDto>(res)),
      catchError(() => of(this.demoProducts().find((p) => p.Id === id) ?? null)),
    );
  }

  getCategories(): Observable<CategoryDto[]> {
    return this.http.get<unknown>(ApiEndpoints.Catalog.categories).pipe(
      map((res) => dataArrayFromEnvelope<CategoryDto>(res)),
      catchError(() => of(this.demoCategories())),
    );
  }

  /** Minimal demo data when the .NET API is unreachable. */
  private demoProducts(): ProductListItemDto[] {
    return [
      {
        Id: 1,
        NameEn: 'Sample product A',
        NameAr: 'منتج تجريبي أ',
        Price: 9.99,
        CategoryName: 'General',
      },
      {
        Id: 2,
        NameEn: 'Sample product B',
        NameAr: 'منتج تجريبي ب',
        Price: 14.5,
        CategoryName: 'General',
      },
    ];
  }

  private demoCategories(): CategoryDto[] {
    return [
      { Id: 1, NameEn: 'General', NameAr: 'عام' },
    ];
  }
}
