import type { CustomerAddressInput } from './customer-address.model';

export interface EcPlaceOrderRequest {
  cartId: number;
  customerId: number;
  sessionId: string;
  addressId: number;
  newAddress: CustomerAddressInput | null;
  shippingMethod: string;
  shippingAmount: number;
  paymentMethodLkpId: number;
  notes?: string;
  couponCode: string;
}

export interface EcPlaceOrderContext {
  cartId: number;
  customerId: number;
  sessionId: string;
}

export interface EcOrderStatusHistoryDto {
  id?: number;
  orderId?: number;
  statusCategory?: string;
  orderStatusLkpId?: number;
  orderStatusNameAr?: string;
  orderStatusNameEn?: string;
  paymentStatusLkpId?: number;
  paymentStatusNameAr?: string;
  paymentStatusNameEn?: string;
  shipmentStatusLkpId?: number;
  shipmentStatusNameAr?: string;
  shipmentStatusNameEn?: string;
  notesAr?: string;
  notesEn?: string;
  changedByUserId?: number;
  changedByUserName?: string;
  statusDate?: string;
}

export interface EcOrderDetailDto {
  id?: number;
  productId?: number;
  productVariantId?: number;
  productName?: string;
  productNameSnapshot?: string;
  variantSku?: string;
  variantSkuSnapshot?: string;
  specificationSummary?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  tax?: number;
  lineTotal?: number;
  total?: number;
  totalPrice?: number;
}

export interface EcOrderDto {
  id: number;
  orderNumber: string;
  customerId?: number;
  customerName?: string;
  addressId?: number;
  addressText?: string;
  orderStatus?: string;
  orderStatusLkpId?: number;
  orderStatusNameAr?: string;
  orderStatusNameEn?: string;
  paymentStatus?: string;
  paymentStatusLkpId?: number;
  paymentStatusNameAr?: string;
  paymentStatusNameEn?: string;
  shippingStatus?: string;
  shippingStatusLkpId?: number;
  shippingStatusNameAr?: string;
  shippingStatusNameEn?: string;
  shippingMethod?: string;
  paymentMethod?: string;
  paymentMethodLkpId?: number;
  paymentMethodNameAr?: string;
  paymentMethodNameEn?: string;
  totalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  shippingAmount?: number;
  finalAmount?: number;
  items?: EcOrderDetailDto[];
  statusHistory?: EcOrderStatusHistoryDto[];
}
