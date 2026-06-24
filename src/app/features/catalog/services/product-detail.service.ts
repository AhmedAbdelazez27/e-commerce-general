import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { LanguageService } from '../../../core/services/language.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { CatalogListingProduct } from '../models/catalog-listing.model';
import { ProductDetailLoadRef } from '../models/catalog-public-product.model';
import { ProductDetail, ProductDetailVariant, ProductDetailVariantContext } from '../models/product-detail.model';
import { ProductDetailApiService } from './product-detail-api.service';
import {
  applyFinalPriceToProduct,
  applyVariantSelectionToProduct,
  mapProductImages,
  mapProductSpecifications,
  mapProductVariants,
  mapPublicProductDetailsToProductDetail,
  mapRelatedProductsToListingProducts,
  pickDefaultVariant,
  resolveProductVariantId,
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
      .getProductDetails({
        ...ref,
        lang,
        currencyId: currency.id,
        currencyCode: currency.code,
      })
      .pipe(
      switchMap((details) => {
        if (!details) {
          return of(EMPTY_RESULT);
        }

        const productId = details.id || details.productId || 0;
        if (productId <= 0) {
          return of(EMPTY_RESULT);
        }

        const nameEn = details.nameEn?.trim() || details.name;
        const nameAr = details.nameAr?.trim() || details.name;

        return forkJoin({
          variants: this.api.getProductVariants(productId, lang, currency),
          images: this.api.getProductImages(productId),
          specifications: this.api.getProductSpecifications(productId, lang),
          related: this.api.getRelatedProducts(productId, lang, currency),
        }).pipe(
          switchMap(({ variants, images, specifications, related }) => {
            const variantList = mapProductVariants(variants);
            const defaultVariant = pickDefaultVariant(variantList, details);
            const productVariantId = resolveProductVariantId(defaultVariant, details);
            const productImages = mapProductImages(images, nameEn, nameAr);

            return this.buildVariantContext(
              productId,
              productVariantId,
              defaultVariant,
              productImages,
              lang,
              currency,
              1,
            ).pipe(
              map((context) => {
                let product = mapPublicProductDetailsToProductDetail(details, {
                  images: context.images.length ? context.images : productImages,
                  specifications:
                    context.specifications.length > 0
                      ? context.specifications
                      : mapProductSpecifications(specifications),
                });

                product = applyVariantSelectionToProduct(product, defaultVariant, context);
                product.hasVariants = variantList.length > 1;

                return {
                  product,
                  variants: variantList,
                  related: mapRelatedProductsToListingProducts(
                    related,
                    this.language.currentLang(),
                  ),
                };
              }),
            );
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
    const currency = this.currency.selection();

    return this.buildVariantContext(
      product.id,
      variant.id,
      variant,
      product.images,
      lang,
      currency,
      quantity,
      true,
    ).pipe(
      switchMap((context) =>
        this.api.getProductSpecifications(product.id, lang, variant.id).pipe(
          map((specifications) => {
            const next = applyVariantSelectionToProduct(product, variant, {
              ...context,
              specifications: mapProductSpecifications(specifications),
            });
            return next;
          }),
        ),
      ),
    );
  }

  refreshPrice(product: ProductDetail, quantity: number): Observable<ProductDetail> {
    const variantId = product.productVariantId;
    if (variantId == null || variantId <= 0) {
      return of(product);
    }

    return this.api
      .getFinalPrice(variantId, this.language.apiCulture(), this.currency.selection(), quantity)
      .pipe(
      map((finalPrice) => (finalPrice ? applyFinalPriceToProduct(product, finalPrice) : product)),
      catchError(() => of(product)),
    );
  }

  private buildVariantContext(
    productId: number,
    productVariantId: number | null,
    variant: ProductDetailVariant | null,
    fallbackImages: ProductDetail['images'],
    lang: string,
    currency: ReturnType<CurrencyService['selection']>,
    quantity: number,
    preferVariantImages = false,
  ): Observable<ProductDetailVariantContext> {
    const images$ =
      productVariantId != null && preferVariantImages
        ? this.api.getVariantImages(productVariantId).pipe(
            switchMap((variantImages) =>
              variantImages.length > 0
                ? of(variantImages)
                : this.api.getProductImages(productId),
            ),
          )
        : of([]);

    const specs$ =
      productVariantId != null
        ? this.api.getProductSpecifications(productId, lang, productVariantId)
        : of([]);

    const price$ =
      productVariantId != null
        ? this.api.getFinalPrice(productVariantId, lang, currency, quantity)
        : of(null);

    return forkJoin({
      images: images$,
      specifications: specs$,
      finalPrice: price$,
    }).pipe(
      map(({ images, specifications, finalPrice }) => {
        const nameEn = fallbackImages[0]?.altEn ?? '';
        const nameAr = fallbackImages[0]?.altAr ?? '';
        const mappedImages =
          images.length > 0 ? mapProductImages(images, nameEn, nameAr) : fallbackImages;

        const price =
          finalPrice?.finalPrice ??
          variant?.price ??
          (productVariantId != null ? 0 : 0);
        const compareAtPrice =
          finalPrice && finalPrice.basePrice > finalPrice.finalPrice
            ? finalPrice.basePrice
            : variant?.compareAtPrice;

        return {
          images: mappedImages,
          specifications: mapProductSpecifications(specifications),
          price,
          compareAtPrice,
          discountPercent:
            compareAtPrice != null && price > 0
              ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
              : undefined,
          sku: variant?.sku ?? '',
          isAvailable: variant?.isAvailable ?? true,
          productVariantId,
        };
      }),
    );
  }
}
