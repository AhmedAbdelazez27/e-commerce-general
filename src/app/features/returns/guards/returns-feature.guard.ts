import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { PortalConfigService } from '../../../core/portal-config/portal-config.service';

export const returnsFeatureGuard: CanActivateFn = () => {
  const portal = inject(PortalConfigService);
  const router = inject(Router);

  if (portal.enableReturns()) {
    return true;
  }

  return router.createUrlTree(['/account/profile']);
};
