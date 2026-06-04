import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { CheckoutStateService } from '../services/checkout-state.service';

export const checkoutAddressGuard: CanActivateFn = () => {
  const state = inject(CheckoutStateService);
  const router = inject(Router);
  if (!state.hasPayment()) {
    return router.createUrlTree(['/checkout/payment']);
  }
  if (state.hasShipping() && state.hasAddress()) {
    return true;
  }
  return router.createUrlTree(['/checkout/address']);
};
