import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';

import { CatalogApiService } from './catalog-api.service';
import {
  buildProductDetailFromListing,
  getMockProductDetail,
  getMockRelatedProducts,
} from '../data/product-detail.mock';
import { ProductDetail } from '../models/product-detail.model';
import { CatalogListingProduct } from '../models/catalog-listing.model';
import { CATALOG_LISTING_PRODUCTS } from '../data/catalog-listing.mock';
import { ProductDetailDto } from '../models/product.model';

export interface ProductDetailResult {
  product: ProductDetail | null;
  related: CatalogListingProduct[];
}

@Injectable({ providedIn: 'root' })
export class ProductDetailService {
  private readonly catalogApi = inject(CatalogApiService);

  /** Simulated latency for loading skeleton; set to 0 when using live API only. */
  private readonly mockDelayMs = 280;

  load(id: number): Observable<ProductDetailResult> {
    const mock = getMockProductDetail(id);
    const related = getMockRelatedProducts(id);

    if (mock) {
      return of({ product: mock, related }).pipe(delay(this.mockDelayMs));
    }

    return this.catalogApi.getProductById(id).pipe(
      map((dto) => this.mapApiResult(dto, id)),
      catchError(() => of({ product: null, related: getMockRelatedProducts(id) })),
      delay(this.mockDelayMs),
    );
  }

  /** Swap mock catalog with API-sourced listing + detail enrichment. */
  setMockCatalogProducts(products: CatalogListingProduct[]): void {
    products.forEach((p) => {
      // Rebuild detail map when API products are injected (extend as needed).
      void buildProductDetailFromListing(p);
    });
  }

  private mapApiResult(dto: ProductDetailDto | null, id: number): ProductDetailResult {
    if (!dto) {
      return { product: null, related: getMockRelatedProducts(id) };
    }

    const listing = CATALOG_LISTING_PRODUCTS.find((p) => p.id === dto.Id);
    if (listing) {
      return {
        product: buildProductDetailFromListing(listing),
        related: getMockRelatedProducts(id),
      };
    }

    const synthetic: CatalogListingProduct = {
      id: dto.Id,
      nameEn: dto.NameEn,
      nameAr: dto.NameAr,
      price: dto.Price,
      compareAtPrice: dto.CompareAtPrice,
      categoryId: 'general',
      categoryNameEn: dto.CategoryName ?? 'General',
      categoryNameAr: dto.CategoryName ?? 'عام',
      brandId: 'general',
      brandNameEn: dto.BrandName ?? 'Brand',
      brandNameAr: dto.BrandName ?? 'علامة',
      reviewCount: dto.ReviewCount,
      discountPercent: dto.DiscountPercent,
      imageUrl: dto.ImageUrl,
      isAvailable: (dto.StockQuantity ?? 1) > 0,
      createdAt: new Date().toISOString(),
    };

    return {
      product: {
        ...buildProductDetailFromListing(synthetic),
        descriptionEn: dto.DescriptionEn ?? synthetic.nameEn,
        descriptionAr: dto.DescriptionAr ?? synthetic.nameAr,
        stockQuantity: dto.StockQuantity ?? 1,
        sku: dto.Sku ?? `SKU-${dto.Id}`,
      },
      related: getMockRelatedProducts(id),
    };
  }
}
