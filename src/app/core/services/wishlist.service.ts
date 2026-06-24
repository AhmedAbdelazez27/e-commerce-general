import { Injectable, computed, inject, signal } from '@angular/core';
import { map } from 'rxjs/operators';

import { AuthTokenService } from './auth-token.service';
import { CurrencyService } from './currency.service';
import { EcWishlistApiService } from '../../features/wishlist/services/ec-wishlist-api.service';
import type { EcWishlistContextRequest, EcWishlistDto } from '../../features/wishlist/models/ec-wishlist.model';
import { ProductCardData } from '../../shared/models/product-card.model';
import { mapStorefrontProductToCardData } from '../../shared/utils/product-card.util';

const WISHLIST_STORAGE_KEY = 'ecommerce_wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly auth = inject(AuthTokenService);
  private readonly api = inject(EcWishlistApiService);
  private readonly currency = inject(CurrencyService);
  private readonly itemsSignal = signal<ProductCardData[]>([]);
  private readonly wishlistMetaSignal = signal<Pick<EcWishlistDto, 'CurrencyCode'> | null>(null);

  constructor() {
    this.currency.currencyChanged$.subscribe(() => {
      if (this.auth.isLoggedIn()) {
        this.refresh();
      }
    });
  }

  readonly items = this.itemsSignal.asReadonly();
  readonly itemCount = computed(() => this.itemsSignal().length);

  displayCurrencyCode(): string {
    const fromWishlist = this.wishlistMetaSignal()?.CurrencyCode?.trim();
    if (fromWishlist) {
      return fromWishlist;
    }
    return this.currency.displayCode();
  }

  refresh(): void {
    const context = this.buildEcWishlistContext();
    if (context.customerId > 0) {
      this.api.getWishlist(context).subscribe((dto) => {
        this.wishlistMetaSignal.set(dto.CurrencyCode ? { CurrencyCode: dto.CurrencyCode } : null);
        this.itemsSignal.set(this.mapWishlistItems(dto));
      });
      return;
    }

    this.wishlistMetaSignal.set(null);
    this.itemsSignal.set(this.readFromStorage());
  }

  isInWishlist(productId: number): boolean {
    return this.itemsSignal().some((item) => item.id === productId);
  }

  isInWishlistVariant(productVariantId: number): boolean {
    return this.itemsSignal().some((item) => item.productVariantId === productVariantId);
  }

  add(product: ProductCardData): boolean {
    if (this.isInWishlist(product.id)) {
      return false;
    }
    const next = [...this.itemsSignal(), product];
    this.persist(next);
    return true;
  }

  remove(productId: number): void {
    const next = this.itemsSignal().filter((item) => item.id !== productId);
    this.persist(next);
  }

  removeVariant(productVariantId: number): void {
    const next = this.itemsSignal().filter((item) => item.productVariantId !== productVariantId);
    this.persist(next);
  }

  toggle(product: ProductCardData): 'added' | 'removed' {
    const context = this.buildEcWishlistContext();
    const variantId = product.productVariantId ?? 0;

    if (context.customerId > 0 && variantId > 0) {
      const exists = this.isInWishlistVariant(variantId);
      if (exists) {
        this.api
          .remove(variantId, context)
          .pipe(map((ok) => (ok ? 'removed' : 'removed' as const)))
          .subscribe(() => this.removeVariant(variantId));
        return 'removed';
      }

      this.api
        .saveProduct({ productVariantId: variantId, ...context })
        .subscribe((ok) => {
          if (ok) {
            this.persist([...this.itemsSignal(), product]);
          }
        });
      return 'added';
    }

    // Guest / fallback local-only.
    if (this.isInWishlist(product.id)) {
      this.remove(product.id);
      return 'removed';
    }
    this.add(product);
    return 'added';
  }

  moveToCart(product: ProductCardData): void {
    const context = this.buildEcWishlistContext();
    const variantId = product.productVariantId ?? 0;
    if (context.customerId > 0 && variantId > 0) {
      this.api.moveToCart({ productVariantId: variantId, ...context }).subscribe((ok) => {
        if (ok) {
          this.removeVariant(variantId);
        }
      });
      return;
    }

    this.remove(product.id);
  }

  private mapWishlistItems(dto: EcWishlistDto): ProductCardData[] {
    const wishlistCurrency = dto.CurrencyCode?.trim();
    return dto.Items.map((item) =>
      mapStorefrontProductToCardData(item, {
        currency: item.currencyCode ?? wishlistCurrency,
      }),
    );
  }

  private buildEcWishlistContext(): EcWishlistContextRequest {
    const selection = this.currency.selection();

    return {
      customerId: this.resolveCustomerId(),
      currencyId: selection.id > 0 ? selection.id : undefined,
      currencyCode: selection.code || undefined,
    };
  }

  private persist(items: ProductCardData[]): void {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota / private mode
    }
    this.itemsSignal.set(items);
  }

  private resolveCustomerId(): number {
    if (!this.auth.isLoggedIn()) {
      return 0;
    }
    const raw = this.auth.getCustomerId();
    if (!raw?.trim()) {
      return 0;
    }
    const id = Number(raw);
    return Number.isFinite(id) ? id : 0;
  }

  private readFromStorage(): ProductCardData[] {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (!raw?.trim()) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(
        (item): item is ProductCardData =>
          !!item &&
          typeof item === 'object' &&
          typeof (item as ProductCardData).id === 'number' &&
          typeof (item as ProductCardData).title === 'string' &&
          typeof (item as ProductCardData).price === 'number',
      );
    } catch {
      return [];
    }
  }
}
