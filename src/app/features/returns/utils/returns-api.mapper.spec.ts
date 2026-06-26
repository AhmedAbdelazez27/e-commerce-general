import {
  normalizeEcReturnDto,
  normalizePagedReturnsResult,
} from './returns-api.mapper';

describe('returns-api.mapper', () => {
  it('normalizes return DTO from PascalCase', () => {
    const dto = normalizeEcReturnDto({
      Id: 7,
      ReturnNo: 'R-100',
      OrderId: 12,
      OrderNumber: 'ORD-12',
      OrderDetailId: 99,
      ProductNameSnapshot: 'Mascara',
      VariantSkuSnapshot: 'SKU-1',
      Reason: 'Damaged',
      RequestedRefundAmount: 25.5,
      ReturnStatusNameEn: 'Pending',
      CreationTime: '2026-06-26T08:00:00Z',
    });

    expect(dto).toEqual({
      id: 7,
      returnNo: 'R-100',
      orderId: 12,
      orderNumber: 'ORD-12',
      orderDetailId: 99,
      productVariantId: undefined,
      productNameSnapshot: 'Mascara',
      variantSkuSnapshot: 'SKU-1',
      customerId: undefined,
      customerName: undefined,
      reason: 'Damaged',
      returnStatusLkpId: undefined,
      returnStatusNameAr: undefined,
      returnStatusNameEn: 'Pending',
      refundAmount: undefined,
      requestedRefundAmount: 25.5,
      approvedDate: null,
      creationTime: '2026-06-26T08:00:00Z',
      notes: null,
    });
  });

  it('normalizes paged returns result', () => {
    const result = normalizePagedReturnsResult({
      TotalCount: 2,
      Items: [
        {
          id: 1,
          returnNo: 'R-1',
          orderId: 1,
          orderNumber: 'O-1',
          orderDetailId: 1,
          productNameSnapshot: 'A',
          reason: 'Changed mind',
          requestedRefundAmount: 10,
        },
        { id: 2 },
      ],
    });

    expect(result.totalCount).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.returnNo).toBe('R-1');
  });
});
