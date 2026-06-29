import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { SKIP_LOADER } from '../http/http-context.tokens';
import { LoaderService } from '../services/loader.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_LOADER)) {
    return next(req);
  }
  const loader = inject(LoaderService);
  loader.increment();
  return next(req).pipe(finalize(() => loader.decrement()));
};
