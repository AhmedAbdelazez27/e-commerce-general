import { FndLookupSelect2Item, FndLookupValueDto } from '../../../core/models/fnd-lookup.model';
import { CheckoutPaymentOption } from '../config/checkout.config';

export function mapPaymentLookupToCheckoutOption(
  item: FndLookupSelect2Item,
  lookupCode?: string,
): CheckoutPaymentOption {
  return {
    id: String(item.id),
    label: item.text,
    description: item.altText?.trim() || undefined,
    code: lookupCode?.trim() || item.additional?.trim() || undefined,
  };
}

export function mapPaymentLookupsToCheckoutOptions(
  items: FndLookupSelect2Item[],
  definitions: FndLookupValueDto[] = [],
): CheckoutPaymentOption[] {
  const codeById = new Map(definitions.map((definition) => [definition.id, definition.lookupCode]));
  return items.map((item) => mapPaymentLookupToCheckoutOption(item, codeById.get(item.id)));
}
