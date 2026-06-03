import { Routes } from '@angular/router';

export const wishlistRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/wishlist-page/wishlist-page.component').then((m) => m.WishlistPageComponent),
  },
];
