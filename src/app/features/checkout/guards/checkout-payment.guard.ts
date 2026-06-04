import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { CheckoutStateService } from '../services/checkout-state.service';

export const checkoutPaymentGuard: CanActivateFn = () => {
  const state = inject(CheckoutStateService);
  const router = inject(Router);
  if (state.hasPayment()) {
    return true;
  }
  return router.createUrlTree(['/checkout/payment']);
};
