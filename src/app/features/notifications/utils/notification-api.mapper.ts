import type { AppLang } from '../../../core/services/language.service';
import type { EcNotificationDto } from '../models/ec-notification.dto';
import type { PagedNotificationsResult } from '../models/paged-notifications.model';
import type { NotificationViewModel } from '../models/notification-view.model';
import { resolveNotificationTarget } from './notification-route.util';

type JsonRecord = Record<string, unknown>;

function readString(o: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'string') {
      return value;
    }
  }
  return undefined;
}

function readNumber(o: JsonRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function readBoolean(o: JsonRecord, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return undefined;
}

export function normalizeEcNotificationDto(raw: unknown): EcNotificationDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const o = raw as JsonRecord;
  const id = readNumber(o, 'id', 'Id');
  const titleAr = readString(o, 'titleAr', 'TitleAr') ?? '';
  const titleEn = readString(o, 'titleEn', 'TitleEn') ?? '';
  const bodyAr = readString(o, 'bodyAr', 'BodyAr') ?? '';
  const bodyEn = readString(o, 'bodyEn', 'BodyEn') ?? '';
  const notificationTypeLkpId = readNumber(o, 'notificationTypeLkpId', 'NotificationTypeLkpId') ?? 0;
  const notificationTypeNameAr = readString(o, 'notificationTypeNameAr', 'NotificationTypeNameAr') ?? '';
  const notificationTypeNameEn = readString(o, 'notificationTypeNameEn', 'NotificationTypeNameEn') ?? '';
  const creationTime = readString(o, 'creationTime', 'CreationTime');
  const isRead = readBoolean(o, 'isRead', 'IsRead') ?? false;

  if (id == null || !creationTime) {
    return null;
  }

  return {
    id,
    titleAr,
    titleEn,
    bodyAr,
    bodyEn,
    notificationTypeLkpId,
    notificationTypeNameAr,
    notificationTypeNameEn,
    referenceType: readString(o, 'referenceType', 'ReferenceType'),
    referenceId: readNumber(o, 'referenceId', 'ReferenceId'),
    imageUrl: readString(o, 'imageUrl', 'ImageUrl'),
    isRead,
    readDate: readString(o, 'readDate', 'ReadDate'),
    creationTime,
  };
}

export function normalizePagedNotificationsResult(raw: unknown): PagedNotificationsResult {
  if (raw == null || typeof raw !== 'object') {
    return { totalCount: 0, items: [] };
  }

  const o = raw as JsonRecord;
  const totalCount = readNumber(o, 'totalCount', 'TotalCount') ?? 0;
  const itemsRaw = o['items'] ?? o['Items'];

  if (!Array.isArray(itemsRaw)) {
    return { totalCount, items: [] };
  }

  const items = itemsRaw
    .map((item) => normalizeEcNotificationDto(item))
    .filter((item): item is EcNotificationDto => item != null);

  return { totalCount, items };
}

export function normalizeUnreadCount(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(0, raw);
  }

  if (raw != null && typeof raw === 'object') {
    const o = raw as JsonRecord;
    const count = readNumber(o, 'count', 'Count', 'unreadCount', 'UnreadCount');
    if (count != null) {
      return Math.max(0, count);
    }
  }

  return 0;
}

export function mapNotificationToViewModel(
  dto: EcNotificationDto,
  lang: AppLang,
): NotificationViewModel {
  const isAr = lang === 'ar';
  const target = resolveNotificationTarget(dto.referenceType, dto.referenceId);

  return {
    id: dto.id,
    title: isAr ? dto.titleAr || dto.titleEn : dto.titleEn || dto.titleAr,
    body: isAr ? dto.bodyAr || dto.bodyEn : dto.bodyEn || dto.bodyAr,
    typeName: isAr
      ? dto.notificationTypeNameAr || dto.notificationTypeNameEn
      : dto.notificationTypeNameEn || dto.notificationTypeNameAr,
    notificationTypeLkpId: dto.notificationTypeLkpId,
    referenceType: dto.referenceType,
    referenceId: dto.referenceId,
    imageUrl: dto.imageUrl,
    isRead: dto.isRead,
    createdAt: new Date(dto.creationTime),
    targetUrl: target
      ? target.length === 1
        ? target[0]
        : `${target[0]}/${target.slice(1).join('/')}`
      : undefined,
  };
}

export function mapNotificationsToViewModels(
  dtos: EcNotificationDto[],
  lang: AppLang,
): NotificationViewModel[] {
  return dtos.map((dto) => mapNotificationToViewModel(dto, lang));
}
