import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { SKIP_AUTH, SKIP_UNAUTHORIZED_HANDLING } from '../http/http-context.tokens';
import { AuthSessionService } from '../services/auth-session.service';

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }

      if (err.status !== 401) {
        return throwError(() => err);
      }

      if (req.context.get(SKIP_AUTH) || req.context.get(SKIP_UNAUTHORIZED_HANDLING)) {
        return throwError(() => err);
      }

      if (!req.headers.has('Authorization')) {
        return throwError(() => err);
      }

      authSession.handleUnauthorized(router.url);
      return throwError(() => err);
    }),
  );
};
