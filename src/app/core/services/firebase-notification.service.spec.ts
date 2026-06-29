import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APP_ENVIRONMENT } from '../tokens/app-environment.token';
import { FirebaseNotificationService } from './firebase-notification.service';
import { EcNotificationsApiService } from '../../features/notifications/services/ec-notifications-api.service';
import { ToastService } from './toast.service';
import { TranslateService } from '@ngx-translate/core';

describe('FirebaseNotificationService', () => {
  let service: FirebaseNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FirebaseNotificationService,
        {
          provide: APP_ENVIRONMENT,
          useValue: {
            enablePushNotifications: false,
            firebase: undefined,
          },
        },
        {
          provide: EcNotificationsApiService,
          useValue: {
            registerDeviceToken: vi.fn(() => of(true)),
            deactivateDeviceToken: vi.fn(() => of(true)),
          },
        },
        {
          provide: ToastService,
          useValue: { info: vi.fn() },
        },
        {
          provide: TranslateService,
          useValue: { instant: (key: string) => key },
        },
      ],
    });

    service = TestBed.inject(FirebaseNotificationService);
  });

  it('reports unsupported when push is disabled', async () => {
    await expect(service.isSupported()).resolves.toBe(false);
  });

  it('deactivates without token safely', () => {
    expect(() => service.deactivate()).not.toThrow();
  });
});
