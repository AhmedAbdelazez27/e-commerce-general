import type { CustomerAddressInput } from './customer-address.model';

export interface EcPlaceOrderRequest {
  cartId: number;
  customerId: number;
  sessionId: string;
  addressId: number;
  newAddress: CustomerAddressInput | null;
  shippingMethod: string | null;
  shippingAmount: number;
  paymentMethodLkpId: number;
  notes?: string;
  couponCode: string;
  currencyId?: number;
  currencyCode?: string;
}

export interface EcPlaceOrderContext {
  cartId: number;
  customerId: number;
  sessionId: string;
  currencyId?: number;
  currencyCode?: string;
}

export interface PlaceOrderOutputDto {
  orderId: number;
  paymentId?: number;
  cartId?: number;
  orderNumber: string;
  finalAmount: number;
  finalAmountLocal?: number;
  currencyId?: number;
  currencyCode?: string;
  orderStatus?: string;
  paymentStatus?: string;
  shippingStatus?: string;
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
  orderDetailId?: number;
  ivItemId?: number;
  variantName?: string;
  reservedQuantity?: number;
  backorderQuantity?: number;
  fulfilledQuantity?: number;
  id?: number;
  productId?: number;
  productVariantId?: number | null;
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
  discountAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
}

export interface EcOrderDto {
  cartId?: number;
  currencyId?: number;
  currencyCode?: string;
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
  productDiscountAmount?: number;
  bundleDiscountAmount?: number;
  couponDiscountAmount?: number;
  taxAmount?: number;
  shippingAmount?: number;
  finalAmount?: number;
  items?: EcOrderDetailDto[];
  statusHistory?: EcOrderStatusHistoryDto[];
}
