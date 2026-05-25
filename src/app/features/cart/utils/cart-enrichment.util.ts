import { CATALOG_LISTING_PRODUCTS } from '../../catalog/data/catalog-listing.mock';
import { CartItemDto } from '../models/cart.model';
import { CartLineItemView } from '../models/cart-view.model';

const productById = new Map(CATALOG_LISTING_PRODUCTS.map((p) => [p.id, p]));

export function enrichCartLineItem(item: CartItemDto): CartLineItemView {
  const catalog = productById.get(item.ProductId);
  const unitPrice = item.UnitPrice ?? catalog?.price ?? 0;
  const quantity = Math.max(0, item.Quantity ?? 0);
  const lineTotal = item.LineTotal ?? unitPrice * quantity;

  return {
    productId: item.ProductId,
    titleEn: catalog?.nameEn ?? item.ProductName ?? `Product #${item.ProductId}`,
    titleAr: catalog?.nameAr ?? item.ProductName ?? `منتج #${item.ProductId}`,
    brandEn: catalog?.brandNameEn ?? '',
    brandAr: catalog?.brandNameAr ?? '',
    unitPrice,
    quantity,
    lineTotal,
    imageUrl: catalog?.imageUrl,
    isAvailable: catalog?.isAvailable ?? true,
    maxQuantity: catalog?.isAvailable ? 99 : 0,
  };
}

export function enrichCartItems(items: CartItemDto[]): CartLineItemView[] {
  return items.map(enrichCartLineItem);
}
