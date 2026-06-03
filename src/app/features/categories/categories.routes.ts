import { Routes } from '@angular/router';

export const categoriesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/categories-page/categories-page.component').then(
        (m) => m.CategoriesPageComponent,
      ),
  },
];
