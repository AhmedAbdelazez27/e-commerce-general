export interface CustomerGroupDto {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  priceListId: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface CustomerProfileDto {
  id: number;
  abpUserId: number;
  customerCode: string;
  customerGroupId: number;
  fullName: string;
  email: string;
  mobile: string;
  loyaltyPoints: number;
  totalSpent: number;
  isVIP: boolean;
  customerGroup?: CustomerGroupDto | null;
}

