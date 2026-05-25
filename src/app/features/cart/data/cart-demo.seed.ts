import { CATALOG_LISTING_PRODUCTS } from '../../catalog/data/catalog-listing.mock';
import { CartDto, CartItemDto } from '../models/cart.model';

/** Demo cart for empty-state preview — used when `CART_CONFIG.seedDemoWhenEmpty` is true. */
export function createDemoCart(): CartDto {
  const picks = CATALOG_LISTING_PRODUCTS.filter((p) => p.isAvailable).slice(0, 3);
  const items: CartItemDto[] = picks.map((p, index) => {
    const qty = index === 0 ? 1 : index === 1 ? 2 : 1;
    const unitPrice = p.price;
    return {
      ProductId: p.id,
      ProductName: p.nameEn,
      Quantity: qty,
      UnitPrice: unitPrice,
      LineTotal: unitPrice * qty,
    };
  });
  return recalculateCartTotals({ Items: items });
}

export function recalculateCartTotals(cart: CartDto): CartDto {
  const items = cart.Items.map((item) => ({
    ...item,
    LineTotal: (item.UnitPrice ?? 0) * (item.Quantity ?? 0),
  }));
  const subtotal = items.reduce((sum, item) => sum + (item.LineTotal ?? 0), 0);
  return {
    ...cart,
    Items: items,
    SubTotal: subtotal,
    Total: subtotal,
  };
}
