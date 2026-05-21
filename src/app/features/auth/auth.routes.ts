import { Routes } from '@angular/router';

import { guestGuard } from '../../core/guards/guest.guard';

/**
 * Auth area (login today; extend with register/forgot-password as lazy siblings).
 */
export const authRoutes: Routes = [
  {
    path: '',
    canActivate: [guestGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/register/register-page.component').then((m) => m.RegisterPageComponent),
      },
    ],
  },
];
