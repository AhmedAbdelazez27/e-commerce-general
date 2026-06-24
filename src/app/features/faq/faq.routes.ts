import { Routes } from '@angular/router';

export const faqRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/faq-page/faq-page.component').then((m) => m.FaqPageComponent),
  },
];
