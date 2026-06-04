import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { checkoutAddressGuard } from './guards/checkout-address.guard';
import { checkoutCartGuard } from './guards/checkout-cart.guard';
import { checkoutPaymentGuard } from './guards/checkout-payment.guard';

export const checkoutRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, checkoutCartGuard],
    loadComponent: () =>
      import('./pages/checkout-shell/checkout-shell.component').then((m) => m.CheckoutShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'payment' },
      {
        path: 'payment',
        loadComponent: () =>
          import('./pages/payment-step/payment-step.component').then((m) => m.PaymentStepComponent),
      },
      {
        path: 'address',
        canActivate: [checkoutPaymentGuard],
        loadComponent: () =>
          import('./pages/address-step/address-step.component').then((m) => m.AddressStepComponent),
      },
      {
        path: 'review',
        canActivate: [checkoutAddressGuard],
        loadComponent: () =>
          import('./pages/review-step/review-step.component').then((m) => m.ReviewStepComponent),
      },
      {
        path: 'success',
        loadComponent: () =>
          import('./pages/order-success/order-success.component').then((m) => m.OrderSuccessComponent),
      },
    ],
  },
];
