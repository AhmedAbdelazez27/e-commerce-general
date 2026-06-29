export interface EcReturnDto {
  id: number;
  returnNo: string;
  orderId: number;
  orderNumber: string;
  orderDetailId: number;
  productVariantId?: number;
  productNameSnapshot: string;
  variantSkuSnapshot?: string;
  customerId?: number;
  customerName?: string;
  reason: string;
  returnStatusLkpId?: number;
  returnStatusNameAr?: string;
  returnStatusNameEn?: string;
  refundStatus?: string | null;
  ivReturnSaleHdId?: number | null;
  refundAmount?: number;
  requestedRefundAmount: number;
  approvedDate?: string | null;
  creationTime?: string;
  notes?: string | null;
}

export interface EcReturnCreateInput {
  orderId: number;
  orderDetailId: number;
  reason: string;
  requestedRefundAmount: number;
  notes?: string;
}

export interface PagedReturnsResult {
  totalCount: number;
  items: EcReturnDto[];
}

export type ReturnListFilter = 'under_review' | 'accepted' | 'rejected' | 'all';
