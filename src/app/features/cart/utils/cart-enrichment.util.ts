import { CATALOG_LISTING_PRODUCTS } from '../../catalog/data/catalog-listing.mock';
import { CatalogListingProduct } from '../../catalog/models/catalog-listing.model';
import { CartItemDto } from '../models/cart.model';
import { CartLineItemView } from '../models/cart-view.model';

const productById = new Map(CATALOG_LISTING_PRODUCTS.map((p) => [p.id, p]));

function resolveListUnitPrice(
  item: CartItemDto,
  catalog: CatalogListingProduct | undefined,
  saleUnitPrice: number,
): number | undefined {
  if (item.FinalPrice != null && item.UnitPrice > item.FinalPrice) {
    return item.UnitPrice;
  }

  if (catalog?.compareAtPrice != null && catalog.compareAtPrice > saleUnitPrice) {
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
  const unitPrice = item.FinalPrice ?? item.UnitPrice ?? catalog?.price ?? 0;
  const compareAtUnitPrice = resolveListUnitPrice(item, catalog, unitPrice);
  const discountPercent = resolveLineDiscountPercent(compareAtUnitPrice, unitPrice);
  const quantity = Math.max(0, item.Quantity ?? 0);
  const lineTotal = item.LineTotal ?? unitPrice * quantity;
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
