import { ProductDetailApiService } from '../../features/catalog/services/product-detail-api.service';
import type { ProductAvailability } from '../../shared/models/product-stock.model';
import { modelId, selectionKey, validQuantity } from '../../shared/utils/product-stock.util';
import { apiErrorMessage } from '../utils/api-error-message.util';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, from, of, forkJoin, firstValueFrom } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { AuthTokenService } from './auth-token.service';
import { CurrencyService } from './currency.service';
import { CartApiService } from '../../features/cart/services/cart-api.service';
import type {
  CartDto,
  EcCartContextRequest,
  GuestCartProductMeta,
} from '../../features/cart/models/cart.model';
import type { ApplyOfferSelectionRequest } from '../../shared/models/promotion.model';
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
  private readonly productApi = inject(ProductDetailApiService);
  readonly availability = signal<Record<string, ProductAvailability>>({});
  readonly reconciliationRequired = signal(false);
  private syncingGuest = false;
  private readonly cartApi = inject(CartApiService);
  private readonly auth = inject(AuthTokenService);
  private readonly currency = inject(CurrencyService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  private readonly cartSignal = signal<CartDto | null>(null);
  private readonly loadingSignal = signal(false);
  private activeCouponCode: string | null = null;
  private requestSequence = 0;
  private latestAppliedSequence = 0;
  private pendingRequests = 0;

  constructor() {
    this.currency.currencyChanged$.subscribe(() => {
      if (this.auth.isLoggedIn()) {
        this.refresh();
      }
    });
  }

  readonly cart = this.cartSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly itemCount = computed(() => {
    const cart = this.cartSignal();
    if (cart?.Items?.length) {
      return cart.Items.reduce((sum, item) => sum + (item.Quantity ?? 0), 0);
    }
    return 0;
  });

  displayCurrencyCode(): string {
    const fromCart = this.cartSignal()?.CurrencyCode?.trim();
    if (fromCart) {
      return fromCart;
    }
    return this.currency.displayCode();
  }

  refresh(couponCode?: string | null): void {
    if (couponCode !== undefined) {
      this.activeCouponCode = couponCode?.trim() ? couponCode.trim() : null;
    }

    if (!this.auth.isLoggedIn()) {
      const cart = readGuestCartFromStorage() ?? { Items: [] };
      this.cartSignal.set(cart.Items.length ? cart : null);
      this.refreshAvailability();
      return;
    }

    const context = this.buildEcCartContext();
    if (context.customerId <= 0) {
      this.cartSignal.set(null);
      return;
    }

    const requestId = this.beginRequest();
    this.cartApi.getEcCart(context).subscribe({
      next: (cart) => {
        this.acceptCart(cart, requestId);
        this.finishRequest();
      },
      error: () => {
        // Preserve the last confirmed cart while the API is unavailable.
        this.finishRequest();
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

    if (this.syncingGuest) return of(undefined);
    this.syncingGuest = true;
    this.beginRequest();
    return from(this.reconcileGuestCart()).pipe(
      catchError((error) => {
        this.toast.error(apiErrorMessage(error, this.translate.instant('CART.RECONCILE_FAILED')));
        this.refresh();
        return of(undefined);
      }),
      finalize(() => {
        this.syncingGuest = false;
        this.finishRequest();
      }),
    );
  }

  private async reconcileGuestCart(): Promise<void> {
    const context = this.buildEcCartContext();
    if (context.customerId <= 0) return;
    const guest = readGuestCartFromStorage();
    if (!guest?.Items.length) return;
    let server = await firstValueFrom(this.cartApi.getEcCart(context));
    for (const item of [...guest.Items]) {
      if (!(item.ProductId > 0) || !validQuantity(item.Quantity))
        throw new Error(this.translate.instant('CART.RECONCILE_FAILED'));
      const existing = server.Items.find(
        (line) =>
          selectionKey(line.ProductId, line.ProductVariantId) ===
          selectionKey(item.ProductId, item.ProductVariantId),
      );
      const pending = item.PendingSync;
      if (pending && pending.customerId !== context.customerId)
        throw new Error(this.translate.instant('CART.RECONCILE_FAILED'));
      const target = pending?.targetQuantity ?? (existing?.Quantity ?? 0) + item.Quantity;
      item.PendingSync = { customerId: context.customerId, targetQuantity: target };
      writeGuestCartToStorage(guest); // Persist before sending; retries set an absolute target after a fresh read.
      if (existing?.CartDetailId) {
        if (existing.Quantity !== target)
          server = await firstValueFrom(
            this.cartApi.updateCart({
              ...context,
              cartDetailId: existing.CartDetailId,
              quantity: target,
            }),
          );
      } else {
        server = await firstValueFrom(
          this.cartApi.addToCart({
            ...context,
            productId: item.ProductId,
            productVariantId: modelId(item.ProductVariantId),
            quantity: target,
          }),
        );
      }
      guest.Items = guest.Items.filter((line) => line !== item);
      writeGuestCartToStorage(guest);
    }
    clearGuestCartStorage();
    this.acceptCart(server, ++this.requestSequence);
  }

  addItem(
    productVariantId: number | null,
    quantity: number,
    couponCode?: string | null,
    productMeta?: GuestCartProductMeta,
  ): Observable<boolean> {
    if (
      this.loading() ||
      this.reconciliationRequired() ||
      !(productMeta?.productId! > 0) ||
      !validQuantity(quantity)
    ) {
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
      productId: productMeta!.productId,
      productVariantId: modelId(productVariantId),
      quantity,
      ...context,
    };

    const requestId = this.beginRequest();
    return this.cartApi.addToCart(body).pipe(
      tap((cart) => {
        this.acceptCart(cart, requestId);
        this.finishRequest();
      }),
      map(() => true),
      catchError((error) => {
        this.finishRequest();
        this.reconcileAfterFailure(error);
        return of(false);
      }),
    );
  }

  updateQuantity(cartDetailId: number, quantity: number, couponCode?: string | null): void {
    if (this.loading() || this.reconciliationRequired() || cartDetailId < 1) {
      return;
    }
    if (quantity <= 0) {
      this.removeItem(cartDetailId, couponCode);
      return;
    }

    const line = this.cartSignal()?.Items.find((item) => item.CartDetailId === cartDetailId);
    if (line && !this.availability()[selectionKey(line.ProductId, line.ProductVariantId)]) {
      this.beginRequest();
      this.productApi
        .getProductAvailability(line.ProductId, modelId(line.ProductVariantId))
        .subscribe({
          next: (value) => {
            this.availability.update((current) => ({
              ...current,
              [selectionKey(line.ProductId, line.ProductVariantId)]: value,
            }));
            this.finishRequest();
            this.updateQuantity(cartDetailId, quantity, couponCode);
          },
          error: (error) => {
            this.finishRequest();
            this.reconcileAfterFailure(error);
          },
        });
      return;
    }
    const stock = line
      ? this.availability()[selectionKey(line.ProductId, line.ProductVariantId)]?.stock
      : undefined;
    if (!validQuantity(quantity, stock)) {
      this.toast.warning(this.translate.instant('INVENTORY.INVALID_QUANTITY'));
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

    const requestId = this.beginRequest();
    this.cartApi.updateCart({ cartDetailId, quantity, ...context }).subscribe({
      next: (cart) => {
        this.acceptCart(cart, requestId);
        this.finishRequest();
      },
      error: (error) => {
        this.finishRequest();
        this.reconcileAfterFailure(error);
      },
    });
  }

  repriceWithCoupon(couponCode: string | null): Observable<CartDto | null> {
    if (!this.auth.isLoggedIn() || this.loading() || this.reconciliationRequired()) return of(null);
    const context = this.buildEcCartContext(couponCode);
    if (context.customerId <= 0) return of(null);

    const requestId = this.beginRequest();
    const current = this.cartSignal();
    const source$ = current
      ? of(current)
      : this.cartApi.getEcCart({ ...context, couponCode: this.activeCouponCode });

    return source$
      .pipe(
        switchMap((cart) => {
          const line = cart.Items.find((item) => (item.CartDetailId ?? 0) > 0);
          if (!line?.CartDetailId) return of(null);
          return this.cartApi.updateCart({
            cartDetailId: line.CartDetailId,
            quantity: line.Quantity,
            ...context,
          });
        }),
      )
      .pipe(
        tap((cart) => {
          if (cart) {
            this.activeCouponCode = cart.CouponCode?.trim() || null;
            this.acceptCart(cart, requestId);
          }
          this.finishRequest();
        }),
        catchError(() => {
          this.finishRequest();
          return of(null);
        }),
      );
  }

  setRewardSelection(cartDetailId: number, selectedReward: boolean): Observable<boolean> {
    if (!this.auth.isLoggedIn() || this.loading() || this.reconciliationRequired())
      return of(false);
    const line = this.cartSignal()?.Items.find((item) => item.CartDetailId === cartDetailId);
    if (!line) return of(false);
    const context = this.buildEcCartContext();
    if (context.customerId <= 0) return of(false);

    const requestId = this.beginRequest();
    return this.cartApi
      .updateCart({
        cartDetailId,
        quantity: line.Quantity,
        selectedReward,
        ...context,
      })
      .pipe(
        tap((cart) => {
          this.acceptCart(cart, requestId);
          this.finishRequest();
        }),
        map(() => true),
        catchError((error) => {
          this.finishRequest();
          this.reconcileAfterFailure(error);
          return of(false);
        }),
      );
  }

  applyOfferSelection(
    request: Omit<
      ApplyOfferSelectionRequest,
      'customerId' | 'currencyId' | 'currencyCode' | 'couponCode'
    >,
  ): Observable<boolean> {
    if (!this.auth.isLoggedIn() || this.loading() || this.reconciliationRequired())
      return of(false);
    const context = this.buildEcCartContext();
    if (context.customerId <= 0) return of(false);

    const requestId = this.beginRequest();
    return this.cartApi
      .applyOfferSelection({
        ...request,
        customerId: context.customerId,
        currencyId: context.currencyId,
        currencyCode: context.currencyCode,
        couponCode: context.couponCode,
      })
      .pipe(
        tap((cart) => {
          this.acceptCart(cart, requestId);
          this.finishRequest();
        }),
        map(() => true),
        catchError((error) => {
          this.finishRequest();
          this.reconcileAfterFailure(error);
          return of(false);
        }),
      );
  }

  removeItem(cartDetailId: number, couponCode?: string | null): void {
    if (this.loading() || this.reconciliationRequired() || cartDetailId < 1) {
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

    const requestId = this.beginRequest();
    this.cartApi
      .removeCartItem(cartDetailId, context)
      .pipe(switchMap(() => this.cartApi.getEcCart(context)))
      .subscribe({
        next: (cart) => {
          this.acceptCart(cart, requestId);
          this.finishRequest();
        },
        error: (error) => {
          this.finishRequest();
          this.reconcileAfterFailure(error);
        },
      });
  }

  getPlaceOrderContext(): {
    cartId: number;
    customerId: number;
    sessionId: string;
    couponCode: string | null;
    currencyId?: number;
    currencyCode?: string;
  } {
    const context = this.buildEcCartContext();
    return {
      cartId: this.cartSignal()?.CartId ?? 0,
      customerId: context.customerId,
      sessionId: '',
      couponCode: context.couponCode,
      currencyId: context.currencyId,
      currencyCode: context.currencyCode,
    };
  }

  clearCart(couponCode?: string | null): Observable<boolean> {
    if (this.loading() || this.reconciliationRequired()) return of(false);
    if (!this.auth.isLoggedIn()) {
      this.clearGuestCart();
      return of(true);
    }

    const context = this.buildEcCartContext(couponCode);
    if (context.customerId <= 0) {
      return of(false);
    }

    const requestId = this.beginRequest();
    return this.cartApi.clearCart(context).pipe(
      switchMap(() => this.cartApi.getEcCart(context)),
      tap((cart) => {
        this.acceptCart(cart, requestId);
        this.finishRequest();
      }),
      map(() => true),
      catchError((error) => {
        this.finishRequest();
        this.reconcileAfterFailure(error);
        return of(false);
      }),
    );
  }

  private addGuestItem(
    productVariantId: number | null,
    quantity: number,
    productMeta?: GuestCartProductMeta,
  ): boolean {
    if (!productMeta) {
      return false;
    }

    const current = readGuestCartFromStorage() ?? { Items: [] };
    const items = [...(current.Items ?? [])];
    const existing = items.find(
      (item) =>
        selectionKey(item.ProductId, item.ProductVariantId) ===
        selectionKey(productMeta.productId, productVariantId),
    );

    if (existing) {
      existing.Quantity += quantity;
      const unitPrice = existing.FinalPrice ?? existing.UnitPrice ?? productMeta.unitPrice;
      existing.LineTotal = unitPrice * existing.Quantity;
    } else {
      items.push(
        buildGuestCartItem(productMeta, productVariantId, quantity, nextGuestCartDetailId(items)),
      );
    }

    const cart = recalcGuestCart(items);
    writeGuestCartToStorage(cart);
    this.cartSignal.set(cart);
    this.refreshAvailability();
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

  refreshAvailability(): void {
    const items = this.cartSignal()?.Items ?? [];
    const sequence = this.latestAppliedSequence;
    if (!items.length) {
      this.availability.set({});
      return;
    }
    forkJoin(
      items.map((item) =>
        this.productApi
          .getProductAvailability(item.ProductId, modelId(item.ProductVariantId))
          .pipe(catchError(() => of(null))),
      ),
    ).subscribe((results) => {
      if (sequence !== this.latestAppliedSequence) return;
      const next: Record<string, ProductAvailability> = {};
      results.forEach((result) => {
        if (result) next[selectionKey(result.productId, result.productVariantId)] = result;
      });
      this.availability.set(next);
    });
  }

  reloadConfirmedCart(): Observable<CartDto> {
    const requestId = this.beginRequest();
    return this.cartApi.getEcCart(this.buildEcCartContext()).pipe(
      tap((cart) => this.acceptCart(cart, requestId)),
      finalize(() => this.finishRequest()),
    );
  }

  /** MoveToCart returns the same authoritative cart contract as cart mutations. */
  acceptWishlistCart(cart: CartDto): void {
    this.acceptCart(cart, ++this.requestSequence);
  }

  reconcileAfterFailure(error?: unknown): void {
    this.reconciliationRequired.set(true);
    this.toast.error(apiErrorMessage(error, this.translate.instant('CART.RECONCILE_FAILED')));
    this.refreshAvailability();
    this.refresh();
  }

  private beginRequest(): number {
    this.pendingRequests += 1;
    this.loadingSignal.set(true);
    return ++this.requestSequence;
  }

  private finishRequest(): void {
    this.pendingRequests = Math.max(0, this.pendingRequests - 1);
    this.loadingSignal.set(this.pendingRequests > 0);
  }

  private acceptCart(cart: CartDto, requestId: number): void {
    if (requestId < this.latestAppliedSequence) return;
    this.latestAppliedSequence = requestId;
    this.cartSignal.set(cart);
    this.reconciliationRequired.set(false);
    this.refreshAvailability();
  }

  private buildEcCartContext(couponCode?: string | null): EcCartContextRequest {
    const code =
      couponCode !== undefined
        ? couponCode?.trim()
          ? couponCode.trim()
          : null
        : this.activeCouponCode;
    const selection = this.currency.selection();

    return {
      customerId: this.resolveCustomerId(),
      sessionId: '',
      couponCode: code,
      currencyId: selection.id > 0 ? selection.id : undefined,
      currencyCode: selection.code || undefined,
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
