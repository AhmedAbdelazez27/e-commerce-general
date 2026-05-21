import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { SKIP_API_BASE } from '../http/http-context.tokens';
import { APP_ENVIRONMENT } from '../tokens/app-environment.token';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_API_BASE)) {
    return next(req);
  }
  let url = req.url;
  if (/^https?:\/\//i.test(url)) {
    return next(req);
  }
  if (url.startsWith('/assets/') || url.startsWith('assets/')) {
    return next(req);
  }
  const env = inject(APP_ENVIRONMENT);
  const base = env.apiBaseUrl.replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return next(req.clone({ url: `${base}${path}` }));
};
