import { CheckoutPaymentOption } from '../config/checkout.config';

const CASH_PAYMENT_CODE = 'cash';

export function isCashPaymentOption(
  option: Pick<CheckoutPaymentOption, 'code' | 'label'>,
): boolean {
  const code = option.code?.trim().toLowerCase();
  if (code === CASH_PAYMENT_CODE) {
    return true;
  }

  const label = option.label?.trim().toLowerCase() ?? '';
  return label === 'كاش' || label === 'cash';
}

export function filterPaymentMethodsByWorkflow(
  methods: CheckoutPaymentOption[],
  settings: { enableCashOnDelivery: boolean; enableOnlinePayment: boolean },
): CheckoutPaymentOption[] {
  return methods.filter((method) =>
    isCashPaymentOption(method)
      ? settings.enableCashOnDelivery
      : settings.enableOnlinePayment,
  );
}
