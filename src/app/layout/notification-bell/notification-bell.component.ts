import {
  Component,
  ElementRef,
  HostListener,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize, take } from 'rxjs/operators';

import { EcNotificationsService } from '../../core/services/ec-notifications.service';
import { LAYOUT_CONFIG } from '../config/layout.config';
import type { NotificationViewModel } from '../../features/notifications/models/notification-view.model';
import { resolveNotificationTarget, sanitizeNotificationUrl } from '../../features/notifications/utils/notification-route.util';

@Component({
  selector: 'app-notification-bell',
  imports: [RouterLink, TranslateModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent {
  private readonly notifications = inject(EcNotificationsService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  readonly open = signal(false);
  readonly markingAll = signal(false);

  readonly unreadCount = this.notifications.unreadCount;
  readonly items = this.notifications.recentNotifications;
  readonly loading = this.notifications.recentLoading;
  readonly error = this.notifications.recentError;
  readonly notificationsRoute = LAYOUT_CONFIG.header.notificationsRoute;

  private lastSeenCount = 0;

  constructor() {
    // Keep the open dropdown list in sync when Firebase push updates the unread count.
    effect(() => {
      const count = this.unreadCount();
      if (this.open() && count !== this.lastSeenCount) {
        this.notifications.loadRecent();
      }
      this.lastSeenCount = count;
    });
  }

  unreadLabel(): string {
    const count = this.unreadCount();
    if (count <= 0) {
      return this.translate.instant('NOTIFICATIONS.BELL_LABEL');
    }
    return this.translate.instant('NOTIFICATIONS.UNREAD_COUNT', { count });
  }

  badgeText(): string {
    const count = this.unreadCount();
    return count > 99 ? '99+' : String(count);
  }

  toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.open.set(true);
    this.notifications.loadRecent();
    queueMicrotask(() => {
      const focusable = this.panelRef()?.nativeElement.querySelector('button, a') as HTMLElement | null;
      focusable?.focus();
    });
  }

  close(): void {
    this.open.set(false);
    this.triggerRef()?.nativeElement.focus();
  }

  retry(): void {
    this.notifications.loadRecent();
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    if (this.markingAll()) {
      return;
    }
    this.markingAll.set(true);
    this.notifications
      .markAllAsRead()
      .pipe(
        take(1),
        finalize(() => this.markingAll.set(false)),
      )
      .subscribe();
  }

  onItemClick(item: NotificationViewModel, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const navigate = (): void => {
      const target = this.resolveTarget(item);
      this.close();
      if (target) {
        void this.router.navigate(target);
        return;
      }
      void this.router.navigate([this.notificationsRoute]);
    };

    if (!item.isRead) {
      this.notifications
        .markAsRead(item.id)
        .pipe(take(1))
        .subscribe(() => navigate());
      return;
    }

    navigate();
  }

  formatDate(value: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(value);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.close();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) {
      return;
    }
    const target = event.target as Node | null;
    const host = this.panelRef()?.nativeElement.parentElement;
    if (host && target && !host.contains(target)) {
      this.close();
    }
  }

  private resolveTarget(item: NotificationViewModel): string[] | null {
    const fromUrl = sanitizeNotificationUrl(item.targetUrl);
    if (fromUrl) {
      return fromUrl;
    }
    return resolveNotificationTarget(item.referenceType, item.referenceId);
  }
}
