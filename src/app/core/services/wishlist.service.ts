import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, defer, firstValueFrom } from 'rxjs';
import { AuthTokenService } from './auth-token.service';
import { CurrencyService } from './currency.service';
import { CartService } from './cart.service';
import { EcWishlistApiService } from '../../features/wishlist/services/ec-wishlist-api.service';
import type {
  EcWishlistContextRequest,
  EcWishlistDto,
} from '../../features/wishlist/models/ec-wishlist.model';
import { ProductCardData } from '../../shared/models/product-card.model';
import { mapStorefrontProductToCardData } from '../../shared/utils/product-card.util';
import { modelId, requiresModel, selectionKey } from '../../shared/utils/product-stock.util';

const WISHLIST_STORAGE_KEY = 'ecommerce_wishlist';
const PENDING_MOVE_KEY = 'ecommerce_wishlist_pending_move';
type Action = 'added' | 'removed' | null;

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly auth = inject(AuthTokenService);
  private readonly api = inject(EcWishlistApiService);
  private readonly currency = inject(CurrencyService);
  private readonly cart = inject(CartService);
  private readonly itemsSignal = signal<ProductCardData[]>([]);
  private readonly wishlistMetaSignal = signal<Pick<EcWishlistDto, 'CurrencyCode'> | null>(null);
  private refreshSequence = 0;
  readonly busy = signal(false);
  readonly recoveryNeeded = signal(false);
  readonly items = this.itemsSignal.asReadonly();
  readonly itemCount = computed(() => this.itemsSignal().length);

  constructor() {
    this.currency.currencyChanged$.subscribe(() => {
      if (this.auth.isLoggedIn()) this.refresh();
    });
  }
  displayCurrencyCode(): string {
    return this.wishlistMetaSignal()?.CurrencyCode?.trim() || this.currency.displayCode();
  }
  refresh(): void {
    if (!this.auth.isLoggedIn()) {
      ++this.refreshSequence;
      this.wishlistMetaSignal.set(null);
      this.itemsSignal.set(this.readFromStorage());
      this.recoveryNeeded.set(false);
      return;
    }
    void this.reload().catch(() => {
      /* Retain last confirmed entries on failure. */
    });
  }
  private async reload(): Promise<void> {
    const sequence = ++this.refreshSequence;
    const owner = this.owner();
    const pending = this.hasPendingMove();
    this.recoveryNeeded.set(pending);
    const [dto] = await Promise.all([
      firstValueFrom(this.api.getWishlist(this.context())),
      pending ? firstValueFrom(this.cart.reloadConfirmedCart()) : Promise.resolve(),
    ]);
    if (owner !== this.owner() || sequence !== this.refreshSequence) return;
    this.accept(dto);
    if (pending) this.setPendingMove(false);
  }
  isInWishlist(productId: number, productVariantId?: number | null): boolean {
    const key = selectionKey(productId, productVariantId);
    return this.itemsSignal().some((item) => selectionKey(item.id, item.productVariantId) === key);
  }
  removeLocal(product: ProductCardData): void {
    const key = selectionKey(product.id, product.productVariantId);
    this.persist(
      this.itemsSignal().filter((item) => selectionKey(item.id, item.productVariantId) !== key),
    );
  }
  toggle(product: ProductCardData): Observable<Action> {
    return defer(async () => {
      if (this.busy() || this.hasPendingMove()) return null;
      const variant = modelId(product.productVariantId);
      const exists = this.isInWishlist(product.id, variant);
      // Removal is allowed even when a previously saved selection is no longer purchasable.
      if (!exists && requiresModel(product.stock) && !variant)
        throw new Error('WISHLIST_MODEL_REQUIRED');
      this.busy.set(true);
      ++this.refreshSequence;
      const owner = this.owner();
      try {
        if (!this.auth.isLoggedIn()) {
          if (exists) this.removeLocal(product);
          else this.persist([...this.itemsSignal(), { ...product, productVariantId: variant }]);
        } else {
          const command = { ...this.context(), productId: product.id, productVariantId: variant };
          if (exists) {
            await firstValueFrom(this.api.remove(command));
            if (owner !== this.owner()) return null;
            await this.reload(); // Remove has no DTO.
          } else {
            const dto = await firstValueFrom(this.api.saveProduct(command));
            if (owner === this.owner()) this.accept(dto);
          }
        }
        return owner === this.owner() ? (exists ? 'removed' : 'added') : null;
      } finally {
        this.busy.set(false);
      }
    });
  }
  moveToCart(product: ProductCardData): Observable<boolean> {
    return defer(async () => {
      if (this.busy() || this.cart.loading()) return false;
      if (this.hasPendingMove()) {
        await this.reload(); // Reconcile first; this click never retries an uncertain add.
        return false;
      }
      if (requiresModel(product.stock) && !modelId(product.productVariantId))
        throw new Error('WISHLIST_MODEL_REQUIRED');
      this.busy.set(true);
      ++this.refreshSequence;
      const owner = this.owner();
      try {
        if (!this.auth.isLoggedIn()) {
          const ok = await firstValueFrom(
            this.cart.addItem(modelId(product.productVariantId), 1, null, {
              productId: product.id,
              productNameEn: product.title,
              productNameAr: product.titleAr ?? product.title,
              variantName: product.variantName,
              variantSku: product.variantSku,
              imageUrl: product.image,
              has3D: product.has3D,
              unitPrice: product.price,
              isAvailable: product.isAvailable,
            }),
          );
          if (ok) this.removeLocal(product);
          return ok;
        }
        this.setPendingMove(true); // Survives reload after a lost response.
        const cart = await firstValueFrom(
          this.api.moveToCart({
            ...this.context(),
            productId: product.id,
            productVariantId: modelId(product.productVariantId),
          }),
        );
        if (owner !== this.owner()) return false;
        this.cart.acceptWishlistCart(cart);
        await this.reload(); // Reload both authoritative cart and wishlist after success.
        return true;
      } catch (error) {
        if (owner === this.owner() && this.auth.isLoggedIn()) {
          // No optimistic removal, and no automatic retry of MoveToCart.
          await this.reload().catch(() => undefined);
        }
        throw error;
      } finally {
        this.busy.set(false);
      }
    });
  }
  private accept(dto: EcWishlistDto): void {
    ++this.refreshSequence;
    this.wishlistMetaSignal.set(dto.CurrencyCode ? { CurrencyCode: dto.CurrencyCode } : null);
    this.itemsSignal.set(
      dto.Items.map((item) => ({
        ...mapStorefrontProductToCardData(item, {
          currency: item.currencyCode ?? dto.CurrencyCode,
        }),
        wishlistItemId: item.wishlistItemId,
        variantName: item.variantName,
        variantNameAr: item.variantNameAr,
        variantSku: item.variantSku,
        quantity: item.quantity,
        availabilityStatus: item.availabilityStatus,
      })),
    );
  }
  private owner(): string {
    return this.auth.isLoggedIn() ? (this.auth.getCustomerId() ?? 'current') : 'guest';
  }
  private context(): EcWishlistContextRequest {
    const selection = this.currency.selection();
    const id = Number(this.auth.getCustomerId());
    return {
      customerId: id > 0 ? id : undefined,
      currencyId: selection.id > 0 ? selection.id : undefined,
      currencyCode: selection.code || undefined,
    };
  }
  private hasPendingMove(): boolean {
    if (!this.auth.isLoggedIn()) return false;
    try {
      return sessionStorage.getItem(PENDING_MOVE_KEY + ':' + this.owner()) === 'pending';
    } catch {
      return this.recoveryNeeded();
    }
  }
  private setPendingMove(pending: boolean): void {
    this.recoveryNeeded.set(pending);
    try {
      const key = PENDING_MOVE_KEY + ':' + this.owner();
      if (pending) sessionStorage.setItem(key, 'pending');
      else sessionStorage.removeItem(key);
    } catch {
      /* in-memory guard remains active */
    }
  }
  private persist(items: ProductCardData[]): void {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* private mode */
    }
    this.itemsSignal.set(items);
  }
  private readFromStorage(): ProductCardData[] {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) ?? '[]');
      if (!Array.isArray(parsed)) return [];
      const selections = new Map<string, ProductCardData>();
      for (const item of parsed) {
        if (
          !item ||
          !(item.id > 0) ||
          typeof item.title !== 'string' ||
          typeof item.price !== 'number'
        )
          continue;
        const normalized = { ...item, productVariantId: modelId(item.productVariantId) };
        selections.set(selectionKey(item.id, normalized.productVariantId), normalized);
      }
      return [...selections.values()];
    } catch {
      return [];
    }
  }
}
