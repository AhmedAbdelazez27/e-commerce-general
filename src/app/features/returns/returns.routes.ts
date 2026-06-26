import { Routes } from '@angular/router';

export const returnsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/returns-page/returns-page.component').then((m) => m.ReturnsPageComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/create-return-page/create-return-page.component').then(
        (m) => m.CreateReturnPageComponent,
      ),
  },
  {
    path: ':returnId',
    loadComponent: () =>
      import('./pages/return-detail-page/return-detail-page.component').then(
        (m) => m.ReturnDetailPageComponent,
      ),
  },
];
