import { CATALOG_LISTING_PRODUCTS } from '../../catalog/data/catalog-listing.mock';
import { CartItemDto } from '../models/cart.model';
import { CartLineItemView } from '../models/cart-view.model';

const productById = new Map(CATALOG_LISTING_PRODUCTS.map((p) => [p.id, p]));

export function enrichCartLineItem(item: CartItemDto): CartLineItemView | null {
  const cartDetailId = item.CartDetailId ?? 0;
  if (cartDetailId < 1) {
    return null;
  }

  const catalog =
    item.ProductId > 0 ? productById.get(item.ProductId) : undefined;
  const unitPrice = item.UnitPrice ?? catalog?.price ?? 0;
  const quantity = Math.max(0, item.Quantity ?? 0);
  const lineTotal = item.LineTotal ?? unitPrice * quantity;
  const nameFromApi = item.ProductName?.trim();

  return {
    cartDetailId,
    productId: item.ProductId > 0 ? item.ProductId : item.ProductVariantId ?? 0,
    productVariantId: item.ProductVariantId,
    titleEn: catalog?.nameEn ?? nameFromApi ?? `Item #${cartDetailId}`,
    titleAr: catalog?.nameAr ?? nameFromApi ?? `عنصر #${cartDetailId}`,
    brandEn: catalog?.brandNameEn ?? '',
    brandAr: catalog?.brandNameAr ?? '',
    unitPrice,
    quantity,
    lineTotal,
    imageUrl: catalog?.imageUrl,
    isAvailable: catalog?.isAvailable ?? true,
    maxQuantity: catalog?.isAvailable ? 99 : quantity,
  };
}

export function enrichCartItems(items: CartItemDto[]): CartLineItemView[] {
  return items.map(enrichCartLineItem).filter((line): line is CartLineItemView => line != null);
}
