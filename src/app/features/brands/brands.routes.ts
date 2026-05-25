import { Routes } from '@angular/router';

export const brandsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/brands-page/brands-page.component').then((m) => m.BrandsPageComponent),
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./pages/brand-boutique-page/brand-boutique-page.component').then(
        (m) => m.BrandBoutiquePageComponent,
      ),
  },
];
