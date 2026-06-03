import { Injectable, computed, signal } from '@angular/core';

import { ProductCardData } from '../../shared/models/product-card.model';

const WISHLIST_STORAGE_KEY = 'ecommerce_wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly itemsSignal = signal<ProductCardData[]>([]);

  readonly items = this.itemsSignal.asReadonly();
  readonly itemCount = computed(() => this.itemsSignal().length);

  refresh(): void {
    this.itemsSignal.set(this.readFromStorage());
  }

  isInWishlist(productId: number): boolean {
    return this.itemsSignal().some((item) => item.id === productId);
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

  toggle(product: ProductCardData): 'added' | 'removed' {
    if (this.isInWishlist(product.id)) {
      this.remove(product.id);
      return 'removed';
    }
    this.add(product);
    return 'added';
  }

  private persist(items: ProductCardData[]): void {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota / private mode
    }
    this.itemsSignal.set(items);
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
