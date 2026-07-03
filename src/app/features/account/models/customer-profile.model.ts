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
  birthDate?: string | null;
  gender?: string | null;
  genderLkpId?: number | null;
  defaultAddressId?: number | null;
  loyaltyPoints: number;
  totalSpent: number;
  isVIP: boolean;
  customerGroup?: CustomerGroupDto | null;
}

export interface UpdateProfileInput {
  customerId: number;
  userId: number;
  fullName: string;
  email: string;
  mobile: string;
  birthDate: string | null;
  gender: string | null;
}

