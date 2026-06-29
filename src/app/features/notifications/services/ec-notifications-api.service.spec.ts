import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { EcNotificationsApiService } from './ec-notifications-api.service';

describe('EcNotificationsApiService', () => {
  let service: EcNotificationsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), EcNotificationsApiService],
    });
    service = TestBed.inject(EcNotificationsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('gets notifications with paging params', async () => {
    const promise = firstValueFrom(
      service.getNotifications({ skipCount: 0, maxResultCount: 10, isRead: false }),
    );

    const req = http.expectOne((r) => r.url.includes(ApiEndpoints.EcNotifications.getMyNotifications));
    expect(req.request.params.get('SkipCount')).toBe('0');
    expect(req.request.params.get('MaxResultCount')).toBe('10');
    expect(req.request.params.get('IsRead')).toBe('false');
    req.flush({
      result: { totalCount: 0, items: [] },
      success: true,
      __abp: true,
    });

    await expect(promise).resolves.toEqual({ totalCount: 0, items: [] });
  });

  it('gets unread count', async () => {
    const promise = firstValueFrom(service.getUnreadCount());
    const req = http.expectOne((r) => r.url.includes(ApiEndpoints.EcNotifications.getUnreadCount));
    req.flush({ result: 3, success: true, __abp: true });
    await expect(promise).resolves.toBe(3);
  });

  it('marks one notification as read', async () => {
    const promise = firstValueFrom(service.markAsRead(9));
    const req = http.expectOne((r) => r.url.includes(ApiEndpoints.EcNotifications.markAsRead));
    expect(req.request.params.get('notificationId')).toBe('9');
    req.flush({ result: true, success: true, __abp: true });
    await expect(promise).resolves.toBe(true);
  });

  it('marks all notifications as read', async () => {
    const promise = firstValueFrom(service.markAllAsRead());
    const req = http.expectOne((r) => r.url.includes(ApiEndpoints.EcNotifications.markAllAsRead));
    req.flush({ result: true, success: true, __abp: true });
    await expect(promise).resolves.toBe(true);
  });

  it('returns safe fallback on network error', async () => {
    const promise = firstValueFrom(service.getUnreadCount());
    const req = http.expectOne((r) => r.url.includes(ApiEndpoints.EcNotifications.getUnreadCount));
    req.error(new ProgressEvent('error'));
    await expect(promise).resolves.toBe(0);
  });
});
