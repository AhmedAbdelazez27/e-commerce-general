import type { EcNotificationDto } from './ec-notification.dto';

export interface PagedNotificationsResult {
  totalCount: number;
  items: EcNotificationDto[];
}
