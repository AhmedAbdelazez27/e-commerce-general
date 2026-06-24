import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { SKIP_TENANT_HEADER } from '../http/http-context.tokens';
import { TenantService } from '../services/tenant.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_TENANT_HEADER)) {
    return next(req);
  }

  const tenantId = inject(TenantService).tenantId();
  if (tenantId == null) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { 'Abp.TenantId': String(tenantId) },
    }),
  );
};
