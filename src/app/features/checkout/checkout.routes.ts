import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

export const checkoutRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/checkout-page/checkout-page.component').then((m) => m.CheckoutPageComponent),
  },
];
