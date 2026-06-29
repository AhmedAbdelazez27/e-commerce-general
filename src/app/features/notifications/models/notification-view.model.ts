export interface NotificationViewModel {
  id: number;
  title: string;
  body: string;
  typeName: string;
  notificationTypeLkpId?: number;
  referenceType?: string;
  referenceId?: number;
  imageUrl?: string;
  isRead: boolean;
  createdAt: Date;
  targetUrl?: string;
}

export type NotificationReadFilter = 'all' | 'read' | 'unread';
