export interface EcNotificationDto {
  id: number;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  notificationTypeLkpId: number;
  notificationTypeNameAr: string;
  notificationTypeNameEn: string;
  referenceType?: string;
  referenceId?: number;
  imagePath?: string;
  imageUrl?: string;
  isRead: boolean;
  readDate?: string;
  creationTime: string;
}
