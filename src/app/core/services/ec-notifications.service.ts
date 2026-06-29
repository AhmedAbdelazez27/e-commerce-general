import { Injectable, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, Subject, Subscription, of } from 'rxjs';
import {
  catchError,
  filter,
  finalize,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';

import { AuthTokenService } from './auth-token.service';
import { LanguageService } from './language.service';
import { EcNotificationsApiService } from '../../features/notifications/services/ec-notifications-api.service';
import type { EcNotificationDto } from '../../features/notifications/models/ec-notification.dto';
import type {
  NotificationReadFilter,
  NotificationViewModel,
} from '../../features/notifications/models/notification-view.model';
import type { PagedNotificationsResult } from '../../features/notifications/models/paged-notifications.model';
import {
  mapNotificationToViewModel,
  mapNotificationsToViewModels,
} from '../../features/notifications/utils/notification-api.mapper';
import type { PushNotificationPayload } from './notification-realtime.adapter';
import { FirebaseNotificationService } from './firebase-notification.service';

export interface NotificationPageFilters {
  readFilter: NotificationReadFilter;
  notificationTypeLkpId?: number | null;
}

export interface NotificationPageState {
  items: NotificationViewModel[];
  totalCount: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: boolean;
}

const DEFAULT_PAGE_SIZE = 20;
const RECENT_COUNT = 10;

@Injectable({ providedIn: 'root' })
export class EcNotificationsService {
  private readonly api = inject(EcNotificationsApiService);
  private readonly auth = inject(AuthTokenService);
  private readonly language = inject(LanguageService);
  private readonly firebaseRealtime = inject(FirebaseNotificationService);
  private readonly router = inject(Router);

  private readonly unreadCountSignal = signal(0);
  private readonly recentSignal = signal<NotificationViewModel[]>([]);
  private readonly recentLoadingSignal = signal(false);
  private readonly recentErrorSignal = signal(false);

  private readonly pageStateSignal = signal<NotificationPageState>({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    loading: false,
    error: false,
  });

  private readonly refreshUnreadSubject = new Subject<void>();
  private unreadFetchInFlight = false;
  private pushSubscription: Subscription | null = null;
  private visibilityBound = false;

  readonly unreadCount = this.unreadCountSignal.asReadonly();
  readonly recentNotifications = this.recentSignal.asReadonly();
  readonly recentLoading = this.recentLoadingSignal.asReadonly();
  readonly recentError = this.recentErrorSignal.asReadonly();
  readonly pageState = this.pageStateSignal.asReadonly();

  readonly hasUnread = computed(() => this.unreadCountSignal() > 0);

  readonly unreadCount$ = this.refreshUnreadSubject.pipe(
    switchMap(() => {
      if (!this.auth.isLoggedIn()) {
        return of(0);
      }
      return this.api.getUnreadCount();
    }),
    tap((count) => this.unreadCountSignal.set(count)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor() {
    this.unreadCount$.subscribe();
    this.bindPushListener();
    this.bindVisibilityRefresh();
    this.bindNavigationRefresh();
  }

  initializeForAuthenticatedUser(): void {
    if (!this.auth.isLoggedIn()) {
      return;
    }

    this.refreshUnreadCount();
    this.firebaseRealtime.start();
  }

  reset(): void {
    this.unreadCountSignal.set(0);
    this.recentSignal.set([]);
    this.recentLoadingSignal.set(false);
    this.recentErrorSignal.set(false);
    this.pageStateSignal.set({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      loading: false,
      error: false,
    });
  }

  refreshUnreadCount(): void {
    if (!this.auth.isLoggedIn() || this.unreadFetchInFlight) {
      if (!this.auth.isLoggedIn()) {
        this.unreadCountSignal.set(0);
      }
      return;
    }

    this.unreadFetchInFlight = true;
    this.api
      .getUnreadCount()
      .pipe(
        take(1),
        finalize(() => {
          this.unreadFetchInFlight = false;
        }),
      )
      .subscribe({
        next: (count) => this.unreadCountSignal.set(count),
        error: () => this.unreadCountSignal.set(0),
      });
  }

  loadRecent(): void {
    if (!this.auth.isLoggedIn()) {
      this.recentSignal.set([]);
      return;
    }

    this.recentLoadingSignal.set(true);
    this.recentErrorSignal.set(false);

    this.api
      .getNotifications({ skipCount: 0, maxResultCount: RECENT_COUNT })
      .pipe(
        take(1),
        finalize(() => this.recentLoadingSignal.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.recentSignal.set(this.mapPageItems(result));
          this.recentErrorSignal.set(false);
        },
        error: () => {
          this.recentSignal.set([]);
          this.recentErrorSignal.set(true);
        },
      });
  }

  loadPage(page: number, filters: NotificationPageFilters, pageSize = DEFAULT_PAGE_SIZE): void {
    if (!this.auth.isLoggedIn()) {
      this.pageStateSignal.set({
        items: [],
        totalCount: 0,
        page: 1,
        pageSize,
        loading: false,
        error: false,
      });
      return;
    }

    const isRead = this.resolveIsReadFilter(filters.readFilter);
    const skipCount = Math.max(0, (page - 1) * pageSize);

    this.pageStateSignal.update((state) => ({ ...state, loading: true, error: false, page, pageSize }));

    this.api
      .getNotifications({
        skipCount,
        maxResultCount: pageSize,
        isRead,
        notificationTypeLkpId: filters.notificationTypeLkpId ?? undefined,
      })
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.pageStateSignal.set({
            items: this.mapPageItems(result),
            totalCount: result.totalCount,
            page,
            pageSize,
            loading: false,
            error: false,
          });
        },
        error: () => {
          this.pageStateSignal.update((state) => ({
            ...state,
            loading: false,
            error: true,
          }));
        },
      });
  }

  markAsRead(notificationId: number): Observable<boolean> {
    return this.api.markAsRead(notificationId).pipe(
      tap((ok) => {
        if (!ok) {
          return;
        }
        this.applyReadLocally(notificationId);
        this.refreshUnreadCount();
      }),
      catchError(() => of(false)),
    );
  }

  markAllAsRead(): Observable<boolean> {
    return this.api.markAllAsRead().pipe(
      tap((ok) => {
        if (!ok) {
          return;
        }
        this.applyAllReadLocally();
        this.unreadCountSignal.set(0);
      }),
      catchError(() => of(false)),
    );
  }

  handlePushMessage(payload: PushNotificationPayload): void {
    if (!this.auth.isLoggedIn()) {
      return;
    }

    // Instant badge feedback before the API round-trip.
    this.unreadCountSignal.update((count) => count + 1);

    if (payload.id != null) {
      this.upsertFromPush(payload);
    }
  }

  upsertFromPush(payload: PushNotificationPayload): void {
    if (payload.id == null) {
      return;
    }

    const lang = this.language.currentLang();
    const viewModel: NotificationViewModel = {
      id: payload.id,
      title: payload.title ?? '',
      body: payload.body ?? '',
      typeName: '',
      referenceType: payload.referenceType,
      referenceId: payload.referenceId,
      isRead: false,
      createdAt: new Date(),
      targetUrl: payload.targetUrl,
    };

    this.recentSignal.update((items) => {
      const withoutDup = items.filter((item) => item.id !== payload.id);
      return [viewModel, ...withoutDup].slice(0, RECENT_COUNT);
    });

    this.pageStateSignal.update((state) => {
      const exists = state.items.some((item) => item.id === payload.id);
      if (exists) {
        return state;
      }
      return {
        ...state,
        items: [viewModel, ...state.items].slice(0, state.pageSize),
        totalCount: state.totalCount + 1,
      };
    });

    if (!payload.title && !payload.body) {
      this.loadRecent();
    }
  }

  distinctTypeOptions(items: NotificationViewModel[]): { id: number; label: string }[] {
    const map = new Map<number, string>();
    for (const item of items) {
      if (item.notificationTypeLkpId && item.typeName) {
        map.set(item.notificationTypeLkpId, item.typeName);
      }
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }

  mapDtoToViewModel(dto: EcNotificationDto): NotificationViewModel {
    return mapNotificationToViewModel(dto, this.language.currentLang());
  }

  private mapPageItems(result: PagedNotificationsResult): NotificationViewModel[] {
    return mapNotificationsToViewModels(result.items, this.language.currentLang());
  }

  private resolveIsReadFilter(filter: NotificationReadFilter): boolean | undefined {
    if (filter === 'read') {
      return true;
    }
    if (filter === 'unread') {
      return false;
    }
    return undefined;
  }

  private applyReadLocally(notificationId: number): void {
    const mark = (item: NotificationViewModel): NotificationViewModel =>
      item.id === notificationId ? { ...item, isRead: true } : item;

    this.recentSignal.update((items) => items.map(mark));
    this.pageStateSignal.update((state) => ({
      ...state,
      items: state.items.map(mark),
    }));
    this.unreadCountSignal.update((count) => Math.max(0, count - 1));
  }

  private applyAllReadLocally(): void {
    const mark = (item: NotificationViewModel): NotificationViewModel => ({ ...item, isRead: true });
    this.recentSignal.update((items) => items.map(mark));
    this.pageStateSignal.update((state) => ({
      ...state,
      items: state.items.map(mark),
    }));
  }

  private bindPushListener(): void {
    if (this.pushSubscription) {
      return;
    }

    this.pushSubscription = this.firebaseRealtime.messages$.subscribe((payload) =>
      this.handlePushMessage(payload),
    );
  }

  private bindVisibilityRefresh(): void {
    if (this.visibilityBound || typeof document === 'undefined') {
      return;
    }

    this.visibilityBound = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.auth.isLoggedIn()) {
        this.refreshUnreadCount();
      }
    });
  }

  /**
   * Refresh the badge after each navigation. Event-driven (no timer, no global loader),
   * so server-created notifications (order placed, return requested) are reflected as the
   * user moves around even when no FCM push is delivered.
   */
  private bindNavigationRefresh(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.auth.isLoggedIn()) {
          this.refreshUnreadCount();
        }
      });
  }
}
