import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';

import { SKIP_AUTH } from '../http/http-context.tokens';

function messageFromError(err: HttpErrorResponse): string {
  const body = err.error as { message?: string } | string | null;
  if (typeof body === 'string' && body.length > 0) {
    return body;
  }
  if (body && typeof body === 'object' && typeof body.message === 'string') {
    return body.message;
  }
  if (err.status === 0) {
    return 'Network error';
  }
  return `HTTP ${err.status}`;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }
      if (req.context.get(SKIP_AUTH)) {
        return throwError(() => err);
      }
      toastr.error(messageFromError(err));
      return throwError(() => err);
    }),
  );
};
