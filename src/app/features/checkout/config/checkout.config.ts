export interface CheckoutPaymentOption {
  id: string;
  label: string;
  description?: string;
}

export interface CheckoutShippingOption {
  id: string;
  labelKey: string;
  amount: number;
}

export const CHECKOUT_CONFIG = {
  defaultCountryId: 1,
  shippingMethods: [
    { id: 'Standard', labelKey: 'CHECKOUT.SHIPPING_STANDARD', amount: 0 },
    { id: 'Express', labelKey: 'CHECKOUT.SHIPPING_EXPRESS', amount: 25 },
  ] satisfies CheckoutShippingOption[],
} as const;
