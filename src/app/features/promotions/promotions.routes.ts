import { Routes } from '@angular/router';

export const promotionsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/offers-page/offers-page.component').then((m) => m.OffersPageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/offer-detail-page/offer-detail-page.component').then(
        (m) => m.OfferDetailPageComponent,
      ),
  },
];
