import { CATALOG_LISTING_PRODUCTS } from '../../catalog/data/catalog-listing.mock';
import { CatalogListingProduct } from '../../catalog/models/catalog-listing.model';
import { CartItemDto } from '../models/cart.model';
import { CartLineItemView } from '../models/cart-view.model';

const productById = new Map(CATALOG_LISTING_PRODUCTS.map((p) => [p.id, p]));

interface LineEconomics {
  /** List / pre-discount price for a single unit. */
  grossUnitPrice: number;
  /** Price actually charged for a single unit (after per-unit discounts). */
  netUnitPrice: number;
  /** Net total for the whole line = netUnitPrice * quantity. */
  lineTotal: number;
}

/**
 * Resolves the per-unit economics for a cart line.
 *
 * The EcCart payload exposes prices in a quantity-aware shape:
 *   - `UnitPrice`  -> gross price for ONE unit (e.g. 550)
 *   - `FinalPrice` / `TotalPrice` (mapped to LineTotal) -> NET total for the WHOLE line (e.g. 2612.5)
 *   - `DiscountAmount` -> discount applied to ONE unit (e.g. 27.5)
 *
 * We derive the net unit price from quantity-independent fields whenever possible so the line
 * total stays correct the instant the quantity changes, even if the API's line totals lag a step.
 */
function resolveLineEconomics(
  item: CartItemDto,
  catalogPrice: number,
  quantity: number,
): LineEconomics {
  const qty = Math.max(0, quantity);
  const grossUnitPrice =
    item.UnitPrice != null && item.UnitPrice > 0 ? item.UnitPrice : Math.max(0, catalogPrice);

  let netUnitPrice = grossUnitPrice;

  if (item.DiscountAmount != null && item.DiscountAmount > 0 && grossUnitPrice - item.DiscountAmount >= 0) {
    // Per-unit discount (quantity-independent) -> safest source for live +/- updates.
    netUnitPrice = grossUnitPrice - item.DiscountAmount;
  } else if (item.FinalPrice != null && item.FinalPrice > 0) {
    // FinalPrice may be a per-unit sale price or a whole-line total.
    netUnitPrice =
      item.FinalPrice <= grossUnitPrice || qty <= 1 ? item.FinalPrice : item.FinalPrice / qty;
  } else if (item.LineTotal != null && item.LineTotal > 0 && qty > 0) {
    netUnitPrice = item.LineTotal / qty;
  }

  netUnitPrice = Math.max(0, netUnitPrice);

  return {
    grossUnitPrice,
    netUnitPrice,
    lineTotal: netUnitPrice * qty,
  };
}

function resolveListUnitPrice(
  grossUnitPrice: number,
  netUnitPrice: number,
  catalog: CatalogListingProduct | undefined,
): number | undefined {
  if (grossUnitPrice > netUnitPrice) {
    return grossUnitPrice;
  }

  if (catalog?.compareAtPrice != null && catalog.compareAtPrice > netUnitPrice) {
    return catalog.compareAtPrice;
  }

  return undefined;
}

function resolveLineDiscountPercent(
  compareAtUnitPrice: number | undefined,
  unitPrice: number,
): number | undefined {
  if (compareAtUnitPrice == null || compareAtUnitPrice <= unitPrice || unitPrice <= 0) {
    return undefined;
  }

  return Math.round(((compareAtUnitPrice - unitPrice) / compareAtUnitPrice) * 100);
}

export function enrichCartLineItem(item: CartItemDto): CartLineItemView | null {
  const cartDetailId = item.CartDetailId ?? 0;
  if (cartDetailId < 1) {
    return null;
  }

  const catalog =
    item.ProductId > 0 ? productById.get(item.ProductId) : undefined;
  const quantity = Math.max(0, item.Quantity ?? 0);
  const { grossUnitPrice, netUnitPrice, lineTotal } = resolveLineEconomics(
    item,
    catalog?.price ?? 0,
    quantity,
  );
  const unitPrice = netUnitPrice;
  const compareAtUnitPrice = resolveListUnitPrice(grossUnitPrice, netUnitPrice, catalog);
  const discountPercent = resolveLineDiscountPercent(compareAtUnitPrice, unitPrice);
  const nameFromApi = item.ProductName?.trim();
  const nameEnFromApi = item.ProductNameEn?.trim() || item.VariantNameEn?.trim();
  const nameArFromApi = item.ProductNameAr?.trim() || item.VariantNameAr?.trim();

  const imageUrl =
    item.ImageUrl?.trim() ||
    item.ProductVariantImageUrl?.trim() ||
    item.ProductImageUrl?.trim() ||
    catalog?.imageUrl;

  const isAvailable = catalog?.isAvailable ?? true;

  return {
    cartDetailId,
    productId: item.ProductId > 0 ? item.ProductId : item.ProductVariantId ?? 0,
    productVariantId: item.ProductVariantId,
    titleEn: catalog?.nameEn ?? nameEnFromApi ?? nameFromApi ?? `Item #${cartDetailId}`,
    titleAr: catalog?.nameAr ?? nameArFromApi ?? nameFromApi ?? `عنصر #${cartDetailId}`,
    brandEn: catalog?.brandNameEn ?? '',
    brandAr: catalog?.brandNameAr ?? '',
    unitPrice,
    compareAtUnitPrice,
    discountPercent,
    quantity,
    lineTotal,
    imageUrl: imageUrl || undefined,
    isAvailable,
    // When catalog data is missing, default to a safe high ceiling.
    maxQuantity: isAvailable ? 99 : quantity,
  };
}

export function enrichCartItems(items: CartItemDto[]): CartLineItemView[] {
  return items.map(enrichCartLineItem).filter((line): line is CartLineItemView => line != null);
}
