import { describe, expect, it } from 'vitest';

import {
  mapNotificationToViewModel,
  normalizeEcNotificationDto,
  normalizePagedNotificationsResult,
  normalizeUnreadCount,
  resolveNotificationImageUrl,
} from './notification-api.mapper';

describe('notification-api.mapper', () => {
  const dto = {
    Id: 1,
    TitleAr: 'عنوان',
    TitleEn: 'Title',
    BodyAr: 'نص',
    BodyEn: 'Body',
    NotificationTypeLkpId: 10,
    NotificationTypeNameAr: 'طلب',
    NotificationTypeNameEn: 'Order',
    ReferenceType: 'Order',
    ReferenceId: 55,
    IsRead: false,
    CreationTime: '2026-01-01T10:00:00Z',
  };

  it('normalizes EcNotificationDto from PascalCase payload', () => {
    expect(normalizeEcNotificationDto(dto)).toEqual({
      id: 1,
      titleAr: 'عنوان',
      titleEn: 'Title',
      bodyAr: 'نص',
      bodyEn: 'Body',
      notificationTypeLkpId: 10,
      notificationTypeNameAr: 'طلب',
      notificationTypeNameEn: 'Order',
      referenceType: 'Order',
      referenceId: 55,
      imagePath: undefined,
      imageUrl: undefined,
      isRead: false,
      readDate: undefined,
      creationTime: '2026-01-01T10:00:00Z',
    });
  });

  it('maps Arabic view model when lang is ar', () => {
    const normalized = normalizeEcNotificationDto(dto)!;
    const vm = mapNotificationToViewModel(normalized, 'ar');
    expect(vm.title).toBe('عنوان');
    expect(vm.body).toBe('نص');
    expect(vm.typeName).toBe('طلب');
    expect(vm.targetUrl).toBe('/account/orders/55');
  });

  it('maps English view model when lang is en', () => {
    const normalized = normalizeEcNotificationDto(dto)!;
    const vm = mapNotificationToViewModel(normalized, 'en');
    expect(vm.title).toBe('Title');
    expect(vm.body).toBe('Body');
    expect(vm.typeName).toBe('Order');
  });

  it('normalizes paged notifications result', () => {
    expect(
      normalizePagedNotificationsResult({
        TotalCount: 2,
        Items: [dto, { ...dto, Id: 2 }],
      }),
    ).toEqual({
      totalCount: 2,
      items: [normalizeEcNotificationDto(dto), normalizeEcNotificationDto({ ...dto, Id: 2 })],
    });
  });

  it('normalizes unread count from number or object', () => {
    expect(normalizeUnreadCount(4)).toBe(4);
    expect(normalizeUnreadCount({ Count: 7 })).toBe(7);
    expect(normalizeUnreadCount(null)).toBe(0);
  });

  it('maps imageUrl from imageUrl or imagePath', () => {
    expect(
      mapNotificationToViewModel(
        {
          ...normalizeEcNotificationDto(dto)!,
          imageUrl: 'https://cdn.example.com/promo.png',
        },
        'en',
      ).imageUrl,
    ).toBe('https://cdn.example.com/promo.png');

    expect(
      mapNotificationToViewModel(
        {
          ...normalizeEcNotificationDto(dto)!,
          imageUrl: undefined,
          imagePath: '/appatt/notifications/promo.png',
        },
        'en',
      ).imageUrl,
    ).toBe('/appatt/notifications/promo.png');

    expect(
      mapNotificationToViewModel(normalizeEcNotificationDto(dto)!, 'en').imageUrl,
    ).toBeUndefined();
  });

  it('resolveNotificationImageUrl prefers imageUrl over imagePath', () => {
    expect(
      resolveNotificationImageUrl('https://cdn.example.com/a.png', '/appatt/b.png'),
    ).toBe('https://cdn.example.com/a.png');
    expect(resolveNotificationImageUrl(undefined, undefined)).toBeUndefined();
  });
});
