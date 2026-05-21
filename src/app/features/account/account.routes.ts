import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

export const accountRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'orders' },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/orders-page/orders-page.component').then((m) => m.OrdersPageComponent),
      },
    ],
  },
];
