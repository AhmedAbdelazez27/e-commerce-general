import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

export const accountRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'profile' },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile-page/profile-page.component').then((m) => m.ProfilePageComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/orders-page/orders-page.component').then((m) => m.OrdersPageComponent),
      },
    ],
  },
];
