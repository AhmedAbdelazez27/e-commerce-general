import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { AuthTokenService } from './auth-token.service';
import { recalculateCartTotals } from '../../features/cart/data/cart-demo.seed';
import { CartApiService } from '../../features/cart/services/cart-api.service';
import type { CartDto, CartItemDto } from '../../features/cart/models/cart.model';

const GUEST_CART_KEY = 'guest_cart';
const GUEST_CART_SESSION_ID_KEY = 'guest_cart_session_id';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly cartApi = inject(CartApiService);
  private readonly auth = inject(AuthTokenService);

  private readonly cartSignal = signal<CartDto | null>(null);
  private readonly loadingSignal = signal(false);

  readonly cart = this.cartSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly itemCount = computed(() => {
    const cart = this.cartSignal();
    if (cart?.Items?.length) {
      return cart.Items.reduce((sum, item) => sum + (item.Quantity ?? 0), 0);
    }
    return this.readGuestCount();
  });

  refresh(): void {
    if (this.auth.isLoggedIn()) {
      this.loadingSignal.set(true);
      this.cartApi.getCart().subscribe({
        next: (cart) => {
          this.cartSignal.set(cart);
          this.loadingSignal.set(false);
        },
        error: () => {
          this.cartSignal.set(null);
          this.loadingSignal.set(false);
        },
      });
      return;
    }

    this.cartSignal.set(this.readGuestCart());
  }

  /** Stable session id for guest-cart merge on register/login. */
  getGuestSessionId(): string | null {
    if (this.auth.isLoggedIn()) {
      return null;
    }
    try {
      const existing = localStorage.getItem(GUEST_CART_SESSION_ID_KEY);
      if (existing && existing.trim()) {
        return existing;
      }
      const created = createSessionId();
      localStorage.setItem(GUEST_CART_SESSION_ID_KEY, created);
      return created;
    } catch {
      return null;
    }
  }

  hasGuestCart(): boolean {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      return !!raw && raw.trim().length > 0;
    } catch {
      return false;
    }
  }

  setGuestCart(cart: CartDto): void {
    // Ensure session id exists once guest cart is created/updated.
    void this.getGuestSessionId();
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    this.cartSignal.set(cart);
  }

  clearGuestCart(): void {
    localStorage.removeItem(GUEST_CART_KEY);
    localStorage.removeItem(GUEST_CART_SESSION_ID_KEY);
    this.cartSignal.set(null);
  }

  addItem(
    productId: number,
    quantity: number,
    unitPrice?: number,
    productName?: string,
  ): Observable<boolean> {
    if (quantity < 1) {
      return of(false);
    }

    if (this.auth.isLoggedIn()) {
      this.loadingSignal.set(true);
      return this.cartApi.addItem({ ProductId: productId, Quantity: quantity }).pipe(
        tap((cart) => {
          this.cartSignal.set(cart);
          this.loadingSignal.set(false);
        }),
        map(() => true),
        catchError(() => {
          this.loadingSignal.set(false);
          return of(false);
        }),
      );
    }

    const cart = this.readGuestCart() ?? { Items: [] };
    const existing = cart.Items.find((i) => i.ProductId === productId);
    const price = unitPrice ?? existing?.UnitPrice ?? 0;
    let items: CartItemDto[];

    if (existing) {
      items = cart.Items.map((i) =>
        i.ProductId === productId
          ? { ...i, Quantity: i.Quantity + quantity, UnitPrice: price }
          : i,
      );
    } else {
      items = [
        ...cart.Items,
        {
          ProductId: productId,
          ProductName: productName,
          Quantity: quantity,
          UnitPrice: price,
        },
      ];
    }

    this.setGuestCart(recalculateCartTotals({ ...cart, Items: items }));
    return of(true);
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity < 1) {
      this.removeItem(productId);
      return;
    }
    if (this.auth.isLoggedIn()) {
      this.loadingSignal.set(true);
      this.cartApi.updateItem({ ProductId: productId, Quantity: quantity }).subscribe({
        next: (cart) => {
          this.cartSignal.set(cart);
          this.loadingSignal.set(false);
        },
        error: () => this.loadingSignal.set(false),
      });
      return;
    }
    const cart = this.readGuestCart();
    if (!cart) {
      return;
    }
    const items = cart.Items.map((i) =>
      i.ProductId === productId ? { ...i, Quantity: quantity } : i,
    );
    this.setGuestCart(recalculateCartTotals({ ...cart, Items: items }));
  }

  removeItem(productId: number): void {
    if (this.auth.isLoggedIn()) {
      this.loadingSignal.set(true);
      this.cartApi.removeItem(productId).subscribe({
        next: (cart) => {
          this.cartSignal.set(cart);
          this.loadingSignal.set(false);
        },
        error: () => this.loadingSignal.set(false),
      });
      return;
    }
    const cart = this.readGuestCart();
    if (!cart) {
      return;
    }
    const items = cart.Items.filter((i) => i.ProductId !== productId);
    if (items.length) {
      this.setGuestCart(recalculateCartTotals({ ...cart, Items: items }));
    } else {
      this.clearGuestCart();
    }
  }

  private readGuestCart(): CartDto | null {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      return raw ? (JSON.parse(raw) as CartDto) : null;
    } catch {
      return null;
    }
  }

  private readGuestCount(): number {
    const cart = this.readGuestCart();
    if (!cart?.Items?.length) {
      return 0;
    }
    return cart.Items.reduce((sum, item) => sum + (item.Quantity ?? 0), 0);
  }
}

function createSessionId(): string {
  // Prefer cryptographically-strong UUID where available.
  const cryptoObj = globalThis.crypto as Crypto | undefined;
  if (cryptoObj && 'randomUUID' in cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  // Fallback: timestamp + random.
  const rand = Math.random().toString(16).slice(2);
  return `guest-${Date.now().toString(16)}-${rand}`;
}
