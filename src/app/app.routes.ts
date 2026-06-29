import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: '',
    loadComponent: () => import('./layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', loadChildren: () => import('./features/home/home.routes').then((m) => m.homeRoutes) },
      {
        path: 'brands',
        loadChildren: () => import('./features/brands/brands.routes').then((m) => m.brandsRoutes),
      },
      {
        path: 'faq',
        loadChildren: () => import('./features/faq/faq.routes').then((m) => m.faqRoutes),
      },
      {
        path: 'contact',
        loadChildren: () => import('./features/contact/contact.routes').then((m) => m.contactRoutes),
      },
      {
        path: 'categories',
        loadChildren: () =>
          import('./features/categories/categories.routes').then((m) => m.categoriesRoutes),
      },
      {
        path: 'shop',
        loadChildren: () => import('./features/catalog/catalog.routes').then((m) => m.catalogRoutes),
      },
      { path: 'cart', loadChildren: () => import('./features/cart/cart.routes').then((m) => m.cartRoutes) },
      {
        path: 'wishlist',
        loadChildren: () => import('./features/wishlist/wishlist.routes').then((m) => m.wishlistRoutes),
      },
      {
        path: 'checkout',
        loadChildren: () => import('./features/checkout/checkout.routes').then((m) => m.checkoutRoutes),
      },
      {
        path: 'account',
        loadChildren: () => import('./features/account/account.routes').then((m) => m.accountRoutes),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('./features/notifications/notifications.routes').then((m) => m.notificationsRoutes),
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
