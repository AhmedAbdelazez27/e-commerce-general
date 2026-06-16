import { FndLookupSelect2Item } from '../../../core/models/fnd-lookup.model';
import { CheckoutPaymentOption } from '../config/checkout.config';

export function mapPaymentLookupToCheckoutOption(item: FndLookupSelect2Item): CheckoutPaymentOption {
  return {
    id: String(item.id),
    label: item.text,
    description: item.altText?.trim() || undefined,
  };
}

export function mapPaymentLookupsToCheckoutOptions(
  items: FndLookupSelect2Item[],
): CheckoutPaymentOption[] {
  return items.map(mapPaymentLookupToCheckoutOption);
}
