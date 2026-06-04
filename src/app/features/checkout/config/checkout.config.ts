export interface CheckoutPaymentOption {
  id: string;
  labelKey: string;
  descriptionKey?: string;
}

export interface CheckoutShippingOption {
  id: string;
  labelKey: string;
  amount: number;
}

export const CHECKOUT_CONFIG = {
  defaultCountryId: 1,
  paymentMethods: [
    { id: 'CashOnDelivery', labelKey: 'CHECKOUT.PAYMENT_COD', descriptionKey: 'CHECKOUT.PAYMENT_COD_DESC' },
    {
      id: 'ManualTransfer',
      labelKey: 'CHECKOUT.PAYMENT_TRANSFER',
      descriptionKey: 'CHECKOUT.PAYMENT_TRANSFER_DESC',
    },
  ] satisfies CheckoutPaymentOption[],
  shippingMethods: [
    { id: 'Standard', labelKey: 'CHECKOUT.SHIPPING_STANDARD', amount: 0 },
    { id: 'Express', labelKey: 'CHECKOUT.SHIPPING_EXPRESS', amount: 25 },
  ] satisfies CheckoutShippingOption[],
} as const;
