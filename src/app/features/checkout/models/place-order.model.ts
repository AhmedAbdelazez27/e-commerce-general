import type { CustomerAddressInput } from './customer-address.model';

export interface EcPlaceOrderRequest {
  customerId: number;
  sessionId: string;
  addressId: number;
  newAddress: CustomerAddressInput | null;
  shippingMethod: string;
  shippingAmount: number;
  paymentMethod: string;
  couponCode: string;
}

export interface EcOrderDetailDto {
  id?: number;
  productName?: string;
  variantSku?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  totalPrice?: number;
}

export interface EcOrderDto {
  id: number;
  orderNumber: string;
  customerId?: number;
  orderStatus?: string;
  paymentStatus?: string;
  shippingStatus?: string;
  totalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  shippingAmount?: number;
  finalAmount?: number;
  items?: EcOrderDetailDto[];
}
