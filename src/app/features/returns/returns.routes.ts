import { Routes } from '@angular/router';

import { returnsFeatureGuard } from './guards/returns-feature.guard';

export const returnsRoutes: Routes = [
  {
    path: '',
    canActivate: [returnsFeatureGuard],
    loadComponent: () =>
      import('./pages/returns-page/returns-page.component').then((m) => m.ReturnsPageComponent),
  },
  {
    path: 'new',
    canActivate: [returnsFeatureGuard],
    loadComponent: () =>
      import('./pages/create-return-page/create-return-page.component').then(
        (m) => m.CreateReturnPageComponent,
      ),
  },
  {
    path: ':returnId',
    canActivate: [returnsFeatureGuard],
    loadComponent: () =>
      import('./pages/return-detail-page/return-detail-page.component').then(
        (m) => m.ReturnDetailPageComponent,
      ),
  },
];
