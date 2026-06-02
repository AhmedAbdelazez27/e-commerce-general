import { CartCouponDefinition } from '../models/cart-view.model';

export const CART_CONFIG = {
  currencyKey: 'PRODUCT_CARD.CURRENCY',
  deliveryFee: 2.5,
  freeDeliveryThreshold: 10,
  /** Seed sample items when cart is empty (demo / mock storefront). */
  seedDemoWhenEmpty: false,
  coupons: [
    { code: 'WELCOME', percentOff: 10, labelKey: 'CART.COUPON.WELCOME_APPLIED' },
    { code: 'SAVE15', percentOff: 15, labelKey: 'CART.COUPON.SAVE15_APPLIED' },
  ] satisfies CartCouponDefinition[],
};
