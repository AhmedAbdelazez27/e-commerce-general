import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, concatMap, last, map, switchMap, tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { AuthTokenService } from './auth-token.service';
import { CartApiService } from '../../features/cart/services/cart-api.service';
import type { CartDto, EcCartContextRequest, GuestCartProductMeta } from '../../features/cart/models/cart.model';
import {
  buildGuestCartItem,
  clearGuestCartStorage,
  nextGuestCartDetailId,
  readGuestCartFromStorage,
  recalcGuestCart,
  writeGuestCartToStorage,
} from '../../features/cart/utils/guest-cart-storage.util';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly cartApi = inject(CartApiService);
  private readonly auth = inject(AuthTokenService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

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
    return 0;
  });

  refresh(couponCode?: string | null): void {
    if (couponCode !== undefined) {
      this.activeCouponCode = couponCode?.trim() ? couponCode.trim() : null;
    }

    if (!this.auth.isLoggedIn()) {
      const cart = readGuestCartFromStorage() ?? { Items: [] };
      this.cartSignal.set(cart.Items.length ? cart : null);
      return;
    }

    const context = this.buildEcCartContext();
    if (context.customerId <= 0) {
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

  hasGuestCart(): boolean {
    const cart = this.cartSignal();
    if (cart?.Items?.length) {
      return true;
    }
    const stored = readGuestCartFromStorage();
    return !!stored?.Items?.length;
  }

  clearGuestCart(): void {
    clearGuestCartStorage();
    if (!this.auth.isLoggedIn()) {
      this.cartSignal.set(null);
    }
  }

  /** Push local guest cart items to the server after login/register. */
  syncGuestCartToServer(): Observable<void> {
    if (!this.auth.isLoggedIn()) {
      return of(undefined);
    }

    const guestCart = readGuestCartFromStorage();
    const items = guestCart?.Items?.filter((item) => (item.ProductVariantId ?? 0) > 0) ?? [];
    if (!items.length) {
      return of(undefined);
    }

    const context = this.buildEcCartContext();
    if (context.customerId <= 0) {
      return of(undefined);
    }

    return from(items).pipe(
      concatMap((item) =>
        this.cartApi
          .addToCart({
            productVariantId: item.ProductVariantId!,
            quantity: item.Quantity,
            ...context,
          })
          .pipe(catchError(() => of(null))),
      ),
      last(null),
      tap(() => this.clearGuestCart()),
      switchMap(() => {
        this.refresh();
        return of(undefined);
      }),
    );
  }

  addItem(
    productVariantId: number,
    quantity: number,
    couponCode?: string | null,
    productMeta?: GuestCartProductMeta,
  ): Observable<boolean> {
    if (productVariantId < 1 || quantity < 1) {
      return of(false);
    }

    if (!this.auth.isLoggedIn()) {
      return of(this.addGuestItem(productVariantId, quantity, productMeta));
    }

    const context = this.buildEcCartContext(couponCode);
    if (context.customerId <= 0) {
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

    if (!this.auth.isLoggedIn()) {
      this.updateGuestQuantity(cartDetailId, quantity);
      return;
    }

    const context = this.buildEcCartContext(couponCode);
    if (context.customerId <= 0) {
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
        error: () => {
          this.loadingSignal.set(false);
          this.toast.error(this.translate.instant('CART.UPDATE_QTY_FAILED'));
          this.cartApi.getEcCart(context).subscribe({
            next: (cart) => this.cartSignal.set(cart),
            error: () => undefined,
          });
        },
      });
  }

  removeItem(cartDetailId: number, couponCode?: string | null): void {
    if (cartDetailId < 1) {
      return;
    }

    if (!this.auth.isLoggedIn()) {
      this.removeGuestItem(cartDetailId);
      return;
    }

    const context = this.buildEcCartContext(couponCode);
    if (context.customerId <= 0) {
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

  getPlaceOrderContext(): {
    cartId: number;
    customerId: number;
    sessionId: string;
    couponCode: string | null;
  } {
    const context = this.buildEcCartContext();
    return {
      cartId: this.cartSignal()?.CartId ?? 0,
      customerId: context.customerId,
      sessionId: '',
      couponCode: context.couponCode,
    };
  }

  clearCart(couponCode?: string | null): Observable<boolean> {
    if (!this.auth.isLoggedIn()) {
      this.clearGuestCart();
      return of(true);
    }

    const context = this.buildEcCartContext(couponCode);
    if (context.customerId <= 0) {
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

  private addGuestItem(
    productVariantId: number,
    quantity: number,
    productMeta?: GuestCartProductMeta,
  ): boolean {
    if (!productMeta) {
      return false;
    }

    const current = readGuestCartFromStorage() ?? { Items: [] };
    const items = [...(current.Items ?? [])];
    const existing = items.find((item) => item.ProductVariantId === productVariantId);

    if (existing) {
      existing.Quantity += quantity;
      const unitPrice = existing.FinalPrice ?? existing.UnitPrice ?? productMeta.unitPrice;
      existing.LineTotal = unitPrice * existing.Quantity;
    } else {
      items.push(
        buildGuestCartItem(
          productMeta,
          productVariantId,
          quantity,
          nextGuestCartDetailId(items),
        ),
      );
    }

    const cart = recalcGuestCart(items);
    writeGuestCartToStorage(cart);
    this.cartSignal.set(cart);
    return true;
  }

  private updateGuestQuantity(cartDetailId: number, quantity: number): void {
    const current = readGuestCartFromStorage();
    if (!current?.Items?.length) {
      return;
    }

    const items = current.Items.map((item) => {
      if (item.CartDetailId !== cartDetailId) {
        return item;
      }
      const unitPrice = item.FinalPrice ?? item.UnitPrice ?? 0;
      return {
        ...item,
        Quantity: quantity,
        LineTotal: unitPrice * quantity,
      };
    });

    const cart = recalcGuestCart(items);
    writeGuestCartToStorage(cart);
    this.cartSignal.set(cart.Items.length ? cart : null);
  }

  private removeGuestItem(cartDetailId: number): void {
    const current = readGuestCartFromStorage();
    if (!current?.Items?.length) {
      return;
    }

    const items = current.Items.filter((item) => item.CartDetailId !== cartDetailId);
    if (!items.length) {
      this.clearGuestCart();
      return;
    }

    const cart = recalcGuestCart(items);
    writeGuestCartToStorage(cart);
    this.cartSignal.set(cart);
  }

  private buildEcCartContext(couponCode?: string | null): EcCartContextRequest {
    const code =
      couponCode !== undefined
        ? couponCode?.trim()
          ? couponCode.trim()
          : null
        : this.activeCouponCode;

    return {
      customerId: this.resolveCustomerId(),
      sessionId: '',
      couponCode: code,
    };
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
}
