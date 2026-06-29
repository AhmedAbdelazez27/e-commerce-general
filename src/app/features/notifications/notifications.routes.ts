import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

export const notificationsRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/notifications-page/notifications-page.component').then(
        (m) => m.NotificationsPageComponent,
      ),
  },
];
