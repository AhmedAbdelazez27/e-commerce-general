import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { finalize, take } from 'rxjs/operators';

import { EcNotificationsService } from '../../../../core/services/ec-notifications.service';
import type {
  NotificationReadFilter,
  NotificationViewModel,
} from '../../models/notification-view.model';
import {
  resolveNotificationTarget,
  sanitizeNotificationUrl,
} from '../../utils/notification-route.util';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-notifications-page',
  imports: [TranslateModule],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.scss',
})
export class NotificationsPageComponent {
  private readonly notifications = inject(EcNotificationsService);
  private readonly router = inject(Router);

  readonly readFilter = signal<NotificationReadFilter>('all');
  readonly markingAll = signal(false);
  readonly expandedId = signal<number | null>(null);
  readonly unreadCount = this.notifications.unreadCount;

  readonly pageState = this.notifications.pageState;

  readonly totalPages = computed(() => {
    const state = this.pageState();
    return Math.max(1, Math.ceil(state.totalCount / state.pageSize));
  });

  constructor() {
    this.loadCurrentPage();
  }

  setReadFilter(filter: NotificationReadFilter): void {
    this.readFilter.set(filter);
    this.loadPage(1);
  }

  reload(): void {
    this.loadCurrentPage();
    this.notifications.refreshUnreadCount();
  }

  previousPage(): void {
    const page = this.pageState().page;
    if (page > 1) {
      this.loadPage(page - 1);
    }
  }

  nextPage(): void {
    const page = this.pageState().page;
    if (page < this.totalPages()) {
      this.loadPage(page + 1);
    }
  }

  markAllAsRead(): void {
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
      .subscribe(() => this.loadCurrentPage());
  }

  toggleExpanded(id: number): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  onItemClick(item: NotificationViewModel): void {
    const navigate = (): void => {
      const target = this.resolveTarget(item);
      if (target) {
        void this.router.navigate(target);
        return;
      }
      this.toggleExpanded(item.id);
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

  private loadCurrentPage(): void {
    this.loadPage(this.pageState().page || 1);
  }

  private loadPage(page: number): void {
    this.notifications.loadPage(page, {
      readFilter: this.readFilter(),
    }, PAGE_SIZE);
  }

  private resolveTarget(item: NotificationViewModel): string[] | null {
    const fromUrl = sanitizeNotificationUrl(item.targetUrl);
    if (fromUrl) {
      return fromUrl;
    }
    return resolveNotificationTarget(item.referenceType, item.referenceId);
  }
}
