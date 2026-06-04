export interface CustomerAddressDto {
  id: number;
  customerId?: number;
  countryId: number;
  city: string;
  area: string;
  street: string;
  building: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
}

export interface CustomerAddressInput {
  customerId: number;
  countryId: number;
  city: string;
  area: string;
  street: string;
  building: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  id?: number;
}

export interface PagedAddressesResult {
  items: CustomerAddressDto[];
  totalCount: number;
}
