import { Routes } from '@angular/router';

export const catalogRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/shop-page/shop-page.component').then((m) => m.ShopPageComponent),
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./pages/product-detail-page/product-detail-page.component').then(
        (m) => m.ProductDetailPageComponent,
      ),
  },
];
