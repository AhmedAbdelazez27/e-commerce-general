import type { EcReturnDto } from '../models/return.model';
import {
  filterReturns,
  isAcceptedReturn,
  isRejectedReturn,
  isUnderReviewReturn,
  resolveReturnStatusKind,
  returnTrackingSteps,
} from './return.util';

function sample(partial: Partial<EcReturnDto> & Pick<EcReturnDto, 'id' | 'returnNo'>): EcReturnDto {
  return {
    orderId: 1,
    orderNumber: 'ORD-1',
    orderDetailId: 1,
    productNameSnapshot: 'Product',
    reason: 'Test',
    requestedRefundAmount: 100,
    ...partial,
  };
}

describe('return.util', () => {
  it('resolves the three API return statuses by lookup id', () => {
    const underReview = sample({
      id: 9,
      returnNo: 'R-9',
      returnStatusLkpId: 42135,
      returnStatusNameEn: 'Under review',
    });
    const rejected = sample({
      id: 5,
      returnNo: 'R-5',
      returnStatusLkpId: 42136,
      returnStatusNameEn: 'Rejected',
    });
    const accepted = sample({
      id: 4,
      returnNo: 'R-4',
      returnStatusLkpId: 42137,
      returnStatusNameEn: 'Accepted',
    });

    expect(resolveReturnStatusKind(underReview)).toBe('under_review');
    expect(resolveReturnStatusKind(rejected)).toBe('rejected');
    expect(resolveReturnStatusKind(accepted)).toBe('accepted');
    expect(isUnderReviewReturn(underReview)).toBe(true);
    expect(isRejectedReturn(rejected)).toBe(true);
    expect(isAcceptedReturn(accepted)).toBe(true);
  });

  it('filters returns by status kind', () => {
    const items = [
      sample({ id: 1, returnNo: 'R-1', returnStatusLkpId: 42135 }),
      sample({ id: 2, returnNo: 'R-2', returnStatusLkpId: 42136 }),
      sample({ id: 3, returnNo: 'R-3', returnStatusLkpId: 42137 }),
    ];

    expect(filterReturns(items, 'under_review')).toHaveLength(1);
    expect(filterReturns(items, 'rejected')).toHaveLength(1);
    expect(filterReturns(items, 'accepted')).toHaveLength(1);
    expect(filterReturns(items, 'all')).toHaveLength(3);
  });

  it('builds a three-step tracker for accepted and rejected returns', () => {
    const acceptedSteps = returnTrackingSteps(
      sample({ id: 4, returnNo: 'R-4', returnStatusLkpId: 42137 }),
    );
    const rejectedSteps = returnTrackingSteps(
      sample({ id: 5, returnNo: 'R-5', returnStatusLkpId: 42136 }),
    );

    expect(acceptedSteps).toHaveLength(3);
    expect(acceptedSteps[2]?.labelKey).toBe('RETURNS.STEP_ACCEPTED');
    expect(acceptedSteps[2]?.tone).toBe('success');
    expect(rejectedSteps[2]?.labelKey).toBe('RETURNS.STEP_REJECTED');
    expect(rejectedSteps[2]?.tone).toBe('danger');
  });
});
