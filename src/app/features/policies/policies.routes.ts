import { Routes } from '@angular/router';

export const policiesRoutes: Routes = [
  {
    path: '',
    redirectTo: 'terms',
    pathMatch: 'full',
  },
  {
    path: ':policyType',
    loadComponent: () =>
      import('./pages/policies-page/policies-page.component').then((m) => m.PoliciesPageComponent),
  },
];
