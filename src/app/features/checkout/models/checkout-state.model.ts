import type { CustomerAddressInput } from './customer-address.model';

export type CheckoutStep = 'payment' | 'address' | 'review' | 'success';

export interface CheckoutAddressSelection {
  useNewAddress: boolean;
  selectedAddressId: number | null;
  newAddress: CustomerAddressInput | null;
}

export interface CheckoutShippingSelection {
  shippingMethod: string;
  shippingAmount: number;
}
