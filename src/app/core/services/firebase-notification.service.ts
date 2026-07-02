import { Injectable, inject } from '@angular/core';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from 'firebase/messaging';
import { Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';

import { APP_ENVIRONMENT } from '../tokens/app-environment.token';
import {
  FCM_SW_PUSH_MESSAGE_TYPE,
  type PushNotificationPayload,
} from './notification-realtime.adapter';
import { EcNotificationsApiService } from '../../features/notifications/services/ec-notifications-api.service';
import { ToastService } from './toast.service';
import { TranslateService } from '@ngx-translate/core';
import { resolveNotificationImageUrl } from '../../features/notifications/utils/notification-api.mapper';
import { sanitizeNotificationUrl, resolveNotificationTarget } from '../../features/notifications/utils/notification-route.util';

const SW_PATH = '/firebase-messaging-sw.js';
const APP_VERSION = '1.0.0';

type FcmData = Record<string, string | undefined>;

@Injectable({ providedIn: 'root' })
export class FirebaseNotificationService {
  private readonly env = inject(APP_ENVIRONMENT);
  private readonly api = inject(EcNotificationsApiService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  private readonly messagesSubject = new Subject<PushNotificationPayload>();
  readonly messages$ = this.messagesSubject.asObservable();

  private app: FirebaseApp | null = null;
  private messaging: Messaging | null = null;
  private currentToken: string | null = null;
  private foregroundUnsubscribe: (() => void) | null = null;
  private started = false;
  private listenersBound = false;

  private readonly swMessageHandler = (event: MessageEvent): void => {
    if (event.data?.type !== FCM_SW_PUSH_MESSAGE_TYPE) {
      return;
    }
    this.dispatchPushPayload(this.mapPayload(event.data), {
      showToast: document.visibilityState === 'visible',
    });
  };

  private readonly visibilityHandler = (): void => {
    if (document.visibilityState !== 'visible' || !this.started) {
      return;
    }
    void this.refreshTokenIfNeeded();
  };

  async isSupported(): Promise<boolean> {
    if (!this.env.enablePushNotifications || !this.env.firebase) {
      return false;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      return await isSupported();
    } catch {
      return false;
    }
  }

  async initialize(): Promise<void> {
    const supported = await this.isSupported();
    // #region agent log
    fetch('http://127.0.0.1:7668/ingest/7d9961ce-efbb-4fcc-9ea1-ac710269f415',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c7e88e'},body:JSON.stringify({sessionId:'c7e88e',hypothesisId:'A,D',location:'firebase-notification.service.ts:initialize',message:'initialize entry',data:{alreadyStarted:this.started,supported,enablePush:this.env.enablePushNotifications,hasFirebaseConfig:!!this.env.firebase,hasVapid:!!this.env.firebase?.vapidKey,notifSupported:(typeof Notification!=='undefined'),notifPermission:(typeof Notification!=='undefined'?Notification.permission:'no-Notification')},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (this.started || !supported) {
      return;
    }

    this.started = true;
    const config = this.env.firebase!;

    try {
      this.app =
        getApps().length > 0
          ? getApps()[0]!
          : initializeApp({
              apiKey: config.apiKey,
              authDomain: config.authDomain,
              projectId: config.projectId,
              storageBucket: config.storageBucket,
              messagingSenderId: config.messagingSenderId,
              appId: config.appId,
              measurementId: config.measurementId,
            });
      this.messaging = getMessaging(this.app);
      this.bindRealtimeListeners();

      const permission = await this.requestPermission();
      // #region agent log
      fetch('http://127.0.0.1:7668/ingest/7d9961ce-efbb-4fcc-9ea1-ac710269f415',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c7e88e'},body:JSON.stringify({sessionId:'c7e88e',hypothesisId:'B',location:'firebase-notification.service.ts:initialize',message:'permission resolved',data:{permission},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (permission !== 'granted') {
        return;
      }

      await this.refreshTokenIfNeeded();
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7668/ingest/7d9961ce-efbb-4fcc-9ea1-ac710269f415',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c7e88e'},body:JSON.stringify({sessionId:'c7e88e',hypothesisId:'A,C',location:'firebase-notification.service.ts:initialize',message:'initialize threw',data:{error:String(err)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      // Push is optional — in-app notifications still work.
    }
  }

  start(): void {
    void this.initialize();
  }

  stop(): void {
    this.foregroundUnsubscribe?.();
    this.foregroundUnsubscribe = null;
    this.unbindRealtimeListeners();
    this.started = false;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    return Notification.requestPermission();
  }

  async getToken(): Promise<string | null> {
    if (!this.messaging || !this.env.firebase?.vapidKey) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(SW_PATH);
      const token = await getToken(this.messaging, {
        vapidKey: this.env.firebase.vapidKey,
        serviceWorkerRegistration: registration,
      });
      this.currentToken = token || null;
      // #region agent log
      fetch('http://127.0.0.1:7668/ingest/7d9961ce-efbb-4fcc-9ea1-ac710269f415',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c7e88e'},body:JSON.stringify({sessionId:'c7e88e',hypothesisId:'C',location:'firebase-notification.service.ts:getToken',message:'getToken result',data:{hasToken:!!token,swScope:registration?.scope},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return this.currentToken;
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7668/ingest/7d9961ce-efbb-4fcc-9ea1-ac710269f415',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c7e88e'},body:JSON.stringify({sessionId:'c7e88e',hypothesisId:'C',location:'firebase-notification.service.ts:getToken',message:'getToken threw',data:{error:String(err)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return null;
    }
  }

  registerWithBackend(token: string): Observable<boolean> {
    return this.api.registerDeviceToken({
      deviceToken: token,
      deviceType: 'Web',
      platform: 'Angular',
      appVersion: APP_VERSION,
    });
  }

  deactivate(): void {
    const token = this.currentToken;
    this.stop();

    if (!token) {
      return;
    }

    this.api.deactivateDeviceToken(token).subscribe();
    this.currentToken = null;
  }

  resolvePushTarget(payload: PushNotificationPayload): string[] | null {
    const fromUrl = sanitizeNotificationUrl(payload.targetUrl);
    if (fromUrl) {
      return fromUrl;
    }

    if (payload.referenceType && payload.referenceId) {
      return resolveNotificationTarget(payload.referenceType, payload.referenceId);
    }

    return null;
  }

  private bindRealtimeListeners(): void {
    if (!this.messaging || this.listenersBound) {
      return;
    }

    this.listenersBound = true;

    // Foreground: Firebase delivers messages while the tab is active.
    this.foregroundUnsubscribe = onMessage(this.messaging, (payload) => {
      this.dispatchPushPayload(this.mapFirebasePayload(payload), { showToast: true });
    });

    // Background bridge: service worker forwards pushes to open tabs.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.swMessageHandler);
    }

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private unbindRealtimeListeners(): void {
    if (!this.listenersBound) {
      return;
    }

    navigator.serviceWorker?.removeEventListener('message', this.swMessageHandler);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.listenersBound = false;
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    const previousToken = this.currentToken;
    const token = await this.getToken();
    // #region agent log
    fetch('http://127.0.0.1:7668/ingest/7d9961ce-efbb-4fcc-9ea1-ac710269f415',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c7e88e'},body:JSON.stringify({sessionId:'c7e88e',hypothesisId:'C,E',location:'firebase-notification.service.ts:refreshTokenIfNeeded',message:'token check',data:{hasToken:!!token,hadPrevious:!!previousToken,willRegister:!!token&&(!previousToken||token!==previousToken)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!token) {
      return;
    }

    if (!previousToken || token !== previousToken) {
      this.registerWithBackend(token).pipe(take(1)).subscribe({
        next: (ok) => {
          // #region agent log
          fetch('http://127.0.0.1:7668/ingest/7d9961ce-efbb-4fcc-9ea1-ac710269f415',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c7e88e'},body:JSON.stringify({sessionId:'c7e88e',hypothesisId:'E',location:'firebase-notification.service.ts:registerWithBackend',message:'register response',data:{ok},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        },
        error: (err) => {
          // #region agent log
          fetch('http://127.0.0.1:7668/ingest/7d9961ce-efbb-4fcc-9ea1-ac710269f415',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c7e88e'},body:JSON.stringify({sessionId:'c7e88e',hypothesisId:'E',location:'firebase-notification.service.ts:registerWithBackend',message:'register error',data:{error:String(err)},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        },
      });
    }
  }

  private dispatchPushPayload(
    payload: PushNotificationPayload,
    options: { showToast: boolean },
  ): void {
    this.messagesSubject.next(payload);

    if (!options.showToast) {
      return;
    }

    const title = payload.title ?? this.translate.instant('NOTIFICATIONS.PUSH_RECEIVED');
    const body = payload.body ?? '';
    if (title || body) {
      this.toast.info(body, title);
    }
  }

  private mapFirebasePayload(payload: {
    notification?: { title?: string; body?: string };
    data?: FcmData;
  }): PushNotificationPayload {
    return this.mapPayload({
      notification: payload.notification,
      data: payload.data,
    });
  }

  private mapPayload(raw: {
    notification?: { title?: string; body?: string };
    data?: FcmData;
  }): PushNotificationPayload {
    const data = raw.data ?? {};
    return {
      id: this.readNumber(data['notificationId'] ?? data['NotificationId'] ?? data['id'] ?? data['Id']),
      title: raw.notification?.title ?? data['title'] ?? data['Title'],
      body: raw.notification?.body ?? data['body'] ?? data['Body'],
      referenceType: data['referenceType'] ?? data['ReferenceType'],
      referenceId: this.readNumber(data['referenceId'] ?? data['ReferenceId']),
      targetUrl: data['targetUrl'] ?? data['TargetUrl'],
      imageUrl: resolveNotificationImageUrl(
        data['imageUrl'] ?? data['ImageUrl'],
        data['imagePath'] ?? data['ImagePath'],
      ),
    };
  }

  private readNumber(value: string | undefined): number | undefined {
    if (!value?.trim()) {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
