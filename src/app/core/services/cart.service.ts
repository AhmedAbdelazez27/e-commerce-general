import { Injectable, computed, inject, signal } from '@angular/core';

import { AuthTokenService } from './auth-token.service';
import { CartApiService } from '../../features/cart/services/cart-api.service';
import type { CartDto } from '../../features/cart/models/cart.model';

const GUEST_CART_KEY = 'guest_cart';

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

  setGuestCart(cart: CartDto): void {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    this.cartSignal.set(cart);
  }

  clearGuestCart(): void {
    localStorage.removeItem(GUEST_CART_KEY);
    this.cartSignal.set(null);
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
