import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthTokenService } from './auth-token.service';
import { LanguageService } from './language.service';
import { EcNotificationsService } from './ec-notifications.service';
import { FirebaseNotificationService } from './firebase-notification.service';
import { EcNotificationsApiService } from '../../features/notifications/services/ec-notifications-api.service';

describe('EcNotificationsService', () => {
  let service: EcNotificationsService;
  let api: {
    getUnreadCount: ReturnType<typeof vi.fn>;
    getNotifications: ReturnType<typeof vi.fn>;
    markAsRead: ReturnType<typeof vi.fn>;
    markAllAsRead: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = {
      getUnreadCount: vi.fn(() => of(2)),
      getNotifications: vi.fn(() => of({ totalCount: 1, items: [] })),
      markAsRead: vi.fn(() => of(true)),
      markAllAsRead: vi.fn(() => of(true)),
    };

    TestBed.configureTestingModule({
      providers: [
        EcNotificationsService,
        { provide: EcNotificationsApiService, useValue: api },
        {
          provide: AuthTokenService,
          useValue: { isLoggedIn: () => true },
        },
        {
          provide: LanguageService,
          useValue: { currentLang: () => 'en' as const },
        },
        {
          provide: FirebaseNotificationService,
          useValue: { start: vi.fn(), messages$: of() },
        },
      ],
    });

    service = TestBed.inject(EcNotificationsService);
  });

  it('refreshes unread count when authenticated', () => {
    service.refreshUnreadCount();
    expect(api.getUnreadCount).toHaveBeenCalled();
    expect(service.unreadCount()).toBe(2);
  });

  it('marks notification as read optimistically', () => {
    service.upsertFromPush({ id: 5, title: 'Hello', body: 'World' });
    service.markAsRead(5).subscribe();
    expect(api.markAsRead).toHaveBeenCalledWith(5);
    expect(service.recentNotifications()[0]?.isRead).toBe(true);
  });

  it('does not duplicate push notifications by id', () => {
    service.upsertFromPush({ id: 7, title: 'A', body: 'B' });
    service.upsertFromPush({ id: 7, title: 'A2', body: 'B2' });
    expect(service.recentNotifications()).toHaveLength(1);
    expect(service.recentNotifications()[0]?.title).toBe('A2');
  });

  it('increments unread count immediately on push', () => {
    api.getUnreadCount.mockReturnValueOnce(of(2)).mockReturnValueOnce(of(3));
    service.refreshUnreadCount();
    expect(service.unreadCount()).toBe(2);
    service.handlePushMessage({ id: 99, title: 'New', body: 'Alert' });
    expect(service.unreadCount()).toBe(3);
  });
});
