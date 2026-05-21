import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthTokenService } from '../services/auth-token.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthTokenService);
  const router = inject(Router);
  if (auth.isLoggedIn()) {
    return router.parseUrl('/home');
  }
  return true;
};
