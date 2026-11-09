import {
  isStorefront3DAssetUrl,
  resolveProductPosterUrl,
} from '../../../shared/utils/storefront-media.util';
import { CartItemDto } from '../models/cart.model';
import { CartLineItemView } from '../models/cart-view.model';

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
 * Returned line totals are authoritative. The legacy fallback applies only when no total exists.
 */
function resolveLineEconomics(
  item: CartItemDto,
  quantity: number,
  authoritativeLineTotals = false,
): LineEconomics {
  const qty = Math.max(0, quantity);
  const grossUnitPrice = item.UnitPrice ?? 0;

  let netUnitPrice = grossUnitPrice;

  if (authoritativeLineTotals || item.LineTotal != null) {
    const returnedLineTotal = item.LineTotal ?? item.FinalPrice;
    const lineTotal = returnedLineTotal ?? grossUnitPrice * qty;
    return {
      grossUnitPrice,
      netUnitPrice: qty > 0 ? lineTotal / qty : grossUnitPrice,
      lineTotal,
    };
  }

  if (
    item.DiscountAmount != null &&
    item.DiscountAmount > 0 &&
    grossUnitPrice - item.DiscountAmount >= 0
  ) {
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

function resolveListUnitPrice(grossUnitPrice: number, netUnitPrice: number): number | undefined {
  if (grossUnitPrice > netUnitPrice) {
    return grossUnitPrice;
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

export function enrichCartLineItem(
  item: CartItemDto,
  authoritativeLineTotals = false,
): CartLineItemView | null {
  const cartDetailId = item.CartDetailId ?? 0;
  if (cartDetailId < 1) {
    return null;
  }

  const quantity = Math.max(0, item.Quantity ?? 0);
  const { grossUnitPrice, netUnitPrice, lineTotal } = resolveLineEconomics(
    item,
    quantity,
    authoritativeLineTotals,
  );
  const unitPrice = netUnitPrice;
  const compareAtUnitPrice = resolveListUnitPrice(grossUnitPrice, netUnitPrice);
  const discountPercent = resolveLineDiscountPercent(compareAtUnitPrice, unitPrice);
  const nameFromApi = item.ProductName?.trim();
  const nameEnFromApi = item.ProductNameEn?.trim() || item.VariantNameEn?.trim();
  const nameArFromApi = item.ProductNameAr?.trim() || item.VariantNameAr?.trim();

  const imageUrl =
    resolveProductPosterUrl(item.ImageUrl) ||
    resolveProductPosterUrl(item.ProductVariantImageUrl) ||
    resolveProductPosterUrl(item.ProductImageUrl);
  const has3D =
    item.HasModel3D === true ||
    isStorefront3DAssetUrl(item.ImageUrl) ||
    isStorefront3DAssetUrl(item.ProductVariantImageUrl) ||
    isStorefront3DAssetUrl(item.ProductImageUrl);

  // Availability is enriched separately from GetProductAvailability, never fixture data.
  const isAvailable = true;

  return {
    cartDetailId,
    productId: item.ProductId,
    productVariantId: item.ProductVariantId,
    titleEn: [
      nameEnFromApi ?? nameFromApi ?? `Item #${cartDetailId}`,
      item.VariantNameEn || item.VariantName,
      item.VariantSku,
    ]
      .filter(Boolean)
      .join(' · '),
    titleAr: [
      nameArFromApi ?? nameFromApi ?? `عنصر #${cartDetailId}`,
      item.VariantNameAr || item.VariantName,
      item.VariantSku,
    ]
      .filter(Boolean)
      .join(' · '),
    brandEn: '',
    brandAr: '',
    unitPrice,
    compareAtUnitPrice,
    discountPercent,
    quantity,
    lineTotal,
    imageUrl: imageUrl || undefined,
    has3D,
    isAvailable,
    // When catalog data is missing, default to a safe high ceiling.
    maxQuantity: isAvailable ? 99 : quantity,
    selectedReward: item.SelectedReward === true,
    productDiscountTotal: item.ProductDiscountTotal ?? 0,
    offerDiscountTotal: item.BundleDiscountTotal ?? 0,
    couponDiscountTotal: item.CouponDiscountTotal ?? 0,
    bundleUsedQuantity: item.BundleUsedQuantity ?? 0,
    rewardQuantity: item.RewardQuantity ?? 0,
  };
}

export function enrichCartItems(
  items: CartItemDto[],
  authoritativeLineTotals = false,
): CartLineItemView[] {
  return items
    .map((item) => enrichCartLineItem(item, authoritativeLineTotals))
    .filter((line): line is CartLineItemView => line != null);
}
