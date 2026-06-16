import { Injectable, computed, inject, signal } from '@angular/core';
import { map } from 'rxjs/operators';

import { AuthTokenService } from './auth-token.service';
import { EcWishlistApiService } from '../../features/wishlist/services/ec-wishlist-api.service';
import { ProductCardData } from '../../shared/models/product-card.model';

const WISHLIST_STORAGE_KEY = 'ecommerce_wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly auth = inject(AuthTokenService);
  private readonly api = inject(EcWishlistApiService);
  private readonly itemsSignal = signal<ProductCardData[]>([]);

  readonly items = this.itemsSignal.asReadonly();
  readonly itemCount = computed(() => this.itemsSignal().length);

  refresh(): void {
    const customerId = this.resolveCustomerId();
    if (customerId > 0) {
      this.api.getWishlist(customerId).subscribe((items) => this.itemsSignal.set(items));
      return;
    }

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
    const customerId = this.resolveCustomerId();
    const variantId = product.productVariantId ?? 0;

    if (customerId > 0 && variantId > 0) {
      const exists = this.isInWishlistVariant(variantId);
      if (exists) {
        this.api
          .remove(variantId, customerId)
          .pipe(map((ok) => (ok ? 'removed' : 'removed' as const)))
          .subscribe(() => this.removeVariant(variantId));
        return 'removed';
      }

      this.api
        .saveProduct({ productVariantId: variantId, customerId })
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
    const customerId = this.resolveCustomerId();
    const variantId = product.productVariantId ?? 0;
    if (customerId > 0 && variantId > 0) {
      this.api.moveToCart({ productVariantId: variantId, customerId }).subscribe((ok) => {
        if (ok) {
          this.removeVariant(variantId);
        }
      });
      return;
    }

    this.remove(product.id);
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
