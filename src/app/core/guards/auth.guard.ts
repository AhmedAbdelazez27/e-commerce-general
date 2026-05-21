import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ApiEndpoints } from '../constants/api-endpoints';
import { AuthTokenService } from '../services/auth-token.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthTokenService);
  const router = inject(Router);
  if (auth.isLoggedIn()) {
    return true;
  }
  const path = router.url.split('?')[0];
  const returnUrl =
    path && !path.startsWith('/auth') && path !== '/login' ? router.url : ApiEndpoints.postLoginUrl;
  return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl } });
};
