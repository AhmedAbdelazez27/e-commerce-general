import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

import { AuthTokenService } from './auth-token.service';
import { CartApiService } from '../../features/cart/services/cart-api.service';
import type { CartDto, EcCartContextRequest } from '../../features/cart/models/cart.model';

const GUEST_CART_KEY = 'guest_cart';
const GUEST_CART_SESSION_ID_KEY = 'guest_cart_session_id';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly cartApi = inject(CartApiService);
  private readonly auth = inject(AuthTokenService);

  private readonly cartSignal = signal<CartDto | null>(null);
  private readonly loadingSignal = signal(false);
  private activeCouponCode: string | null = null;

  readonly cart = this.cartSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly itemCount = computed(() => {
    const cart = this.cartSignal();
    if (cart?.Items?.length) {
      return cart.Items.reduce((sum, item) => sum + (item.Quantity ?? 0), 0);
    }
    if (!this.auth.isLoggedIn()) {
      return this.readGuestCount();
    }
    return 0;
  });

  refresh(couponCode?: string | null): void {
    if (couponCode !== undefined) {
      this.activeCouponCode = couponCode?.trim() ? couponCode.trim() : null;
    }

    const context = this.buildEcCartContext();
    if (!context.sessionId && context.customerId <= 0) {
      this.cartSignal.set(null);
      return;
    }

    this.loadingSignal.set(true);
    this.cartApi.getEcCart(context).subscribe({
      next: (cart) => {
        this.cartSignal.set(cart);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.cartSignal.set(null);
        this.loadingSignal.set(false);
      },
    });
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
    const cart = this.cartSignal();
    if (cart?.Items?.length) {
      return true;
    }
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      return !!raw && raw.trim().length > 0;
    } catch {
      return false;
    }
  }

  clearGuestCart(): void {
    localStorage.removeItem(GUEST_CART_KEY);
    localStorage.removeItem(GUEST_CART_SESSION_ID_KEY);
    this.cartSignal.set(null);
  }

  addItem(productVariantId: number, quantity: number, couponCode?: string | null): Observable<boolean> {
    if (productVariantId < 1 || quantity < 1) {
      return of(false);
    }

    const context = this.buildEcCartContext(couponCode);
    if (!context.sessionId && context.customerId <= 0) {
      return of(false);
    }

    const body = {
      productVariantId,
      quantity,
      ...context,
    };

    this.loadingSignal.set(true);
    return this.cartApi.addToCart(body).pipe(
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

  updateQuantity(cartDetailId: number, quantity: number, couponCode?: string | null): void {
    if (cartDetailId < 1) {
      return;
    }
    if (quantity < 1) {
      this.removeItem(cartDetailId, couponCode);
      return;
    }

    const context = this.buildEcCartContext(couponCode);
    if (!context.sessionId && context.customerId <= 0) {
      return;
    }

    this.loadingSignal.set(true);
    this.cartApi
      .updateCart({ cartDetailId, quantity, ...context })
      .subscribe({
        next: (cart) => {
          this.cartSignal.set(cart);
          this.loadingSignal.set(false);
        },
        error: () => this.loadingSignal.set(false),
      });
  }

  removeItem(cartDetailId: number, couponCode?: string | null): void {
    if (cartDetailId < 1) {
      return;
    }

    const context = this.buildEcCartContext(couponCode);
    if (!context.sessionId && context.customerId <= 0) {
      return;
    }

    this.loadingSignal.set(true);
    this.cartApi
      .removeCartItem(cartDetailId, context)
      .pipe(
        switchMap(() => this.cartApi.getEcCart(context)),
        catchError(() => of({ Items: [] } as CartDto)),
      )
      .subscribe({
        next: (cart) => {
          this.cartSignal.set(cart);
          this.loadingSignal.set(false);
        },
        error: () => this.loadingSignal.set(false),
      });
  }

  clearCart(couponCode?: string | null): Observable<boolean> {
    const context = this.buildEcCartContext(couponCode);
    if (!context.sessionId && context.customerId <= 0) {
      return of(false);
    }

    this.loadingSignal.set(true);
    return this.cartApi.clearCart(context).pipe(
      switchMap(() => this.cartApi.getEcCart(context)),
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

  private buildEcCartContext(couponCode?: string | null): EcCartContextRequest {
    const loggedIn = this.auth.isLoggedIn();
    const code =
      couponCode !== undefined
        ? couponCode?.trim()
          ? couponCode.trim()
          : null
        : this.activeCouponCode;

    return {
      customerId: loggedIn ? this.resolveCustomerId() : 0,
      sessionId: loggedIn ? null : this.getGuestSessionId(),
      couponCode: code,
    };
  }

  private resolveCustomerId(): number {
    const raw = this.auth.getCustomerId();
    if (!raw?.trim()) {
      return 0;
    }
    const id = Number(raw);
    return Number.isFinite(id) ? id : 0;
  }

  private readGuestCount(): number {
    const cart = this.readGuestCart();
    if (!cart?.Items?.length) {
      return 0;
    }
    return cart.Items.reduce((sum, item) => sum + (item.Quantity ?? 0), 0);
  }

  private readGuestCart(): CartDto | null {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      return raw ? (JSON.parse(raw) as CartDto) : null;
    } catch {
      return null;
    }
  }
}

function createSessionId(): string {
  const cryptoObj = globalThis.crypto as Crypto | undefined;
  if (cryptoObj && 'randomUUID' in cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  const rand = Math.random().toString(16).slice(2);
  return `guest-${Date.now().toString(16)}-${rand}`;
}
