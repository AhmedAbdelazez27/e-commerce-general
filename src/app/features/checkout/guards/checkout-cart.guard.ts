import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { CartService } from '../../../core/services/cart.service';

export const checkoutCartGuard: CanActivateFn = () => {
  const cart = inject(CartService);
  const router = inject(Router);

  cart.refresh();
  if (cart.itemCount() > 0) {
    return true;
  }
  return router.createUrlTree(['/cart']);
};
