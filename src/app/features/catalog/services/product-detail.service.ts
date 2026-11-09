import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { LanguageService } from '../../../core/services/language.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { requiresModel } from '../../../shared/utils/product-stock.util';
import { CatalogListingProduct } from '../models/catalog-listing.model';
import { ProductDetailLoadRef } from '../models/catalog-public-product.model';
import { ProductDetail, ProductDetailVariant } from '../models/product-detail.model';
import { ProductDetailApiService } from './product-detail-api.service';
import {
  applyFinalPriceToProduct,
  mapProductImages,
  mapProductSpecifications,
  mapProductVariants,
  mapPublicProductDetailsToProductDetail,
  mapRelatedProductsToListingProducts,
} from '../utils/product-detail-api.mapper';

export interface ProductDetailResult {
  product: ProductDetail | null;
  variants: ProductDetailVariant[];
  related: CatalogListingProduct[];
}
const EMPTY_RESULT: ProductDetailResult = { product: null, variants: [], related: [] };

@Injectable({ providedIn: 'root' })
export class ProductDetailService {
  private readonly api = inject(ProductDetailApiService);
  private readonly language = inject(LanguageService);
  private readonly currency = inject(CurrencyService);

  load(ref: ProductDetailLoadRef): Observable<ProductDetailResult> {
    const lang = this.language.apiCulture();
    const currency = this.currency.selection();
    return this.api
      .getProductDetails({ ...ref, lang, currencyId: currency.id, currencyCode: currency.code })
      .pipe(
        switchMap((details) => {
          if (!details) return of(EMPTY_RESULT);
          const productId = details.productId || details.id;
          const modelControlled = requiresModel(details.stock);
          return forkJoin({
            variants: modelControlled
              ? this.api.getProductVariants(productId, lang, currency)
              : of([]),
            images: this.api.getProductImages(productId),
            specifications: this.api.getProductSpecifications(productId, lang),
            related: this.api.getRelatedProducts(productId, lang, currency),
            price: modelControlled
              ? of(null)
              : this.api.getFinalPrice(productId, null, lang, currency),
            availability: this.api
              .getProductAvailability(productId)
              .pipe(catchError(() => of(null))),
          }).pipe(
            map((result) => {
              const images = mapProductImages(
                result.images.length ? result.images : (details.images ?? []),
                details.nameEn || details.name,
                details.nameAr || details.name,
              );
              let product = mapPublicProductDetailsToProductDetail(details, {
                images,
                specifications: mapProductSpecifications(
                  result.specifications.filter((s) => s.isItemSpecification === true),
                ),
              });
              product.baseImages = images;
              if (result.price) product = applyFinalPriceToProduct(product, result.price);
              product.priceQuantity = 1;
              product.productVariantId = null;
              product.selectedVariantId = null;
              product.hasVariants = modelControlled;
              if (result.availability) {
                product.stock = result.availability.stock;
                product.stockQuantity = result.availability.stock?.available ?? 0;
                product.isAvailable = result.availability.isAvailable;
              }
              if (!modelControlled && !result.price) product.isAvailable = false;
              return {
                product,
                variants: mapProductVariants(result.variants),
                related: mapRelatedProductsToListingProducts(
                  result.related,
                  this.language.currentLang(),
                ),
              };
            }),
          );
        }),
        catchError(() => of(EMPTY_RESULT)),
      );
  }

  selectVariant(
    product: ProductDetail,
    variant: ProductDetailVariant,
    quantity: number,
  ): Observable<ProductDetail> {
    const lang = this.language.apiCulture();
    return forkJoin({
      images: this.api.getVariantImages(variant.id),
      specifications: this.api.getProductSpecifications(product.id, lang, variant.id),
      price: this.api.getFinalPrice(
        product.id,
        variant.id,
        lang,
        this.currency.selection(),
        quantity,
      ),
      availability: this.api.getProductAvailability(product.id, variant.id),
    }).pipe(
      map((result) => {
        // Empty resolved specifications are meaningful (including hidden overrides).
        const next: ProductDetail = {
          ...product,
          selectedVariantId: variant.id,
          productVariantId: variant.id,
          variantName: variant.name,
          sku: variant.sku,
          images: result.images.length
            ? mapProductImages(result.images, product.nameEn, product.nameAr)
            : (product.baseImages ?? []),
          specifications: mapProductSpecifications(result.specifications),
          stock: result.availability.stock,
          stockQuantity: result.availability.stock?.available ?? 0,
          isAvailable: result.availability.isAvailable && result.price != null,
          price: result.price?.finalPrice ?? variant.price,
          priceQuantity: quantity,
          compareAtPrice: undefined,
          discountPercent: undefined,
          offers: result.price?.offers ?? variant.offers ?? [],
        };
        return result.price ? applyFinalPriceToProduct(next, result.price) : next;
      }),
    );
  }

  refreshPrice(product: ProductDetail, quantity: number): Observable<ProductDetail> {
    if (requiresModel(product.stock) && !product.productVariantId) return of(product);
    return this.api
      .getFinalPrice(
        product.id,
        product.productVariantId ?? null,
        this.language.apiCulture(),
        this.currency.selection(),
        quantity,
      )
      .pipe(
        map((price) =>
          price
            ? {
                ...applyFinalPriceToProduct({ ...product, priceQuantity: quantity }, price),
                priceQuantity: quantity,
              }
            : { ...product, isAvailable: false },
        ),
      );
  }
}
