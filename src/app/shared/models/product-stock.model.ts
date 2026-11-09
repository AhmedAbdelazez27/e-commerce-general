export type AvailabilityStatus = 'InStock' | 'Backorder' | 'OutOfStock';

export interface ProductStock {
  onHand?: number;
  reserved?: number;
  warehouseAvailable?: number | null;
  available: number;
  controlType: number;
  lotType?: number | null;
  allowOnlineBackorder: boolean;
  maxBackorderQuantity?: number | null;
  expectedAvailabilityDate?: string | null;
  backorderMessage?: string | null;
  isAvailable?: boolean;
  availabilityStatus?: AvailabilityStatus;
}

export interface ProductAvailability {
  productId: number;
  productVariantId: number | null;
  stock?: ProductStock;
  isAvailable: boolean;
  availabilityStatus?: AvailabilityStatus;
}
