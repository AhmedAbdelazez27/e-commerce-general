export interface ReturnReasonOption {
  id: string;
  labelKey: string;
}

export const RETURN_REASON_OPTIONS: ReturnReasonOption[] = [
  { id: 'changed_mind', labelKey: 'RETURNS.REASON_CHANGED_MIND' },
  { id: 'wrong_size', labelKey: 'RETURNS.REASON_WRONG_SIZE' },
  { id: 'damaged', labelKey: 'RETURNS.REASON_DAMAGED' },
  { id: 'not_as_described', labelKey: 'RETURNS.REASON_NOT_AS_DESCRIBED' },
  { id: 'wrong_item', labelKey: 'RETURNS.REASON_WRONG_ITEM' },
  { id: 'other', labelKey: 'RETURNS.REASON_OTHER' },
];
