import { Observable } from 'rxjs';

export const FCM_SW_PUSH_MESSAGE_TYPE = 'FCM_PUSH';

export interface PushNotificationPayload {
  id?: number;
  title?: string;
  body?: string;
  referenceType?: string;
  referenceId?: number;
  targetUrl?: string;
}

export interface NotificationRealtimeAdapter {
  start(): void;
  stop(): void;
  readonly messages$: Observable<PushNotificationPayload>;
}

export const NOTIFICATION_REALTIME_ADAPTER = Symbol('NOTIFICATION_REALTIME_ADAPTER');
