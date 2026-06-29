import { provideRouter, Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationBellComponent } from './notification-bell.component';
import { EcNotificationsService } from '../../core/services/ec-notifications.service';

describe('NotificationBellComponent', () => {
  let fixture: ComponentFixture<NotificationBellComponent>;
  let notifications: {
    unreadCount: ReturnType<typeof signal<number>>;
    recentNotifications: ReturnType<typeof signal<[]>>;
    recentLoading: ReturnType<typeof signal<boolean>>;
    recentError: ReturnType<typeof signal<boolean>>;
    loadRecent: ReturnType<typeof vi.fn>;
    markAsRead: ReturnType<typeof vi.fn>;
    markAllAsRead: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    notifications = {
      unreadCount: signal(2),
      recentNotifications: signal([]),
      recentLoading: signal(false),
      recentError: signal(false),
      loadRecent: vi.fn(),
      markAsRead: vi.fn(() => of(true)),
      markAllAsRead: vi.fn(() => of(true)),
    };

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: EcNotificationsService, useValue: notifications },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    fixture.detectChanges();
  });

  it('renders unread badge', () => {
    const badge = fixture.nativeElement.querySelector('.store-header__cart-badge');
    expect(badge?.textContent?.trim()).toBe('2');
  });

  it('opens dropdown and loads recent notifications', () => {
    const trigger = fixture.nativeElement.querySelector('.notification-bell__trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(notifications.loadRecent).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.notification-bell__panel')).toBeTruthy();
  });

  it('shows empty state when there are no notifications', () => {
    const trigger = fixture.nativeElement.querySelector('.notification-bell__trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('NOTIFICATIONS.EMPTY');
  });
});
