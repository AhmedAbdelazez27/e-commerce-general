import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { SKIP_LOADER } from '../../../core/http/http-context.tokens';
import { resultFromAbpEnvelope } from '../../../core/utils/api-envelope.util';
import type { PagedNotificationsResult } from '../models/paged-notifications.model';
import {
  normalizePagedNotificationsResult,
  normalizeUnreadCount,
} from '../utils/notification-api.mapper';

export interface GetNotificationsParams {
  skipCount?: number;
  maxResultCount?: number;
  isRead?: boolean;
  notificationTypeLkpId?: number;
}

export interface RegisterDeviceTokenBody {
  deviceToken: string;
  deviceType: string;
  platform: string;
  appVersion: string;
}

@Injectable({ providedIn: 'root' })
export class EcNotificationsApiService {
  private readonly http = inject(HttpClient);

  /** Notifications run their own loading UI — keep the global loader silent. */
  private silentContext(): HttpContext {
    return new HttpContext().set(SKIP_LOADER, true);
  }

  getNotifications(params: GetNotificationsParams = {}): Observable<PagedNotificationsResult> {
    let httpParams = new HttpParams()
      .set('SkipCount', String(params.skipCount ?? 0))
      .set('MaxResultCount', String(params.maxResultCount ?? 20));

    if (params.isRead != null) {
      httpParams = httpParams.set('IsRead', String(params.isRead));
    }

    if (params.notificationTypeLkpId != null && params.notificationTypeLkpId > 0) {
      httpParams = httpParams.set('NotificationTypeLkpId', String(params.notificationTypeLkpId));
    }

    return this.http
      .get<unknown>(ApiEndpoints.EcNotifications.getMyNotifications, {
        params: httpParams,
        context: this.silentContext(),
      })
      .pipe(
        map((res) => normalizePagedNotificationsResult(resultFromAbpEnvelope(res))),
        catchError(() => of({ totalCount: 0, items: [] })),
      );
  }

  getUnreadCount(): Observable<number> {
    return this.http
      .get<unknown>(ApiEndpoints.EcNotifications.getUnreadCount, { context: this.silentContext() })
      .pipe(
        map((res) => normalizeUnreadCount(resultFromAbpEnvelope(res) ?? res)),
        catchError(() => of(0)),
      );
  }

  markAsRead(notificationId: number): Observable<boolean> {
    const params = new HttpParams().set('notificationId', String(notificationId));
    return this.http
      .post<unknown>(ApiEndpoints.EcNotifications.markAsRead, null, {
        params,
        context: this.silentContext(),
      })
      .pipe(
        map((res) => resultFromAbpEnvelope(res) != null || res != null),
        catchError(() => of(false)),
      );
  }

  markAllAsRead(): Observable<boolean> {
    return this.http
      .post<unknown>(ApiEndpoints.EcNotifications.markAllAsRead, {}, { context: this.silentContext() })
      .pipe(
        map((res) => resultFromAbpEnvelope(res) != null || res != null),
        catchError(() => of(false)),
      );
  }

  registerDeviceToken(body: RegisterDeviceTokenBody): Observable<boolean> {
    return this.http
      .post<unknown>(ApiEndpoints.EcNotifications.registerDeviceToken, body, {
        context: this.silentContext(),
      })
      .pipe(
        map((res) => resultFromAbpEnvelope(res) != null || res != null),
        catchError(() => of(false)),
      );
  }

  deactivateDeviceToken(deviceToken: string): Observable<boolean> {
    return this.http
      .post<unknown>(
        ApiEndpoints.EcNotifications.deactivateDeviceToken,
        { deviceToken },
        { context: this.silentContext() },
      )
      .pipe(
        map((res) => resultFromAbpEnvelope(res) != null || res != null),
        catchError(() => of(false)),
      );
  }
}
