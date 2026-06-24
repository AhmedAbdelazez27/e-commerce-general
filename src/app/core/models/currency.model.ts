export interface PublicCurrencyDto {
  id: number;
  code: string;
  descriptionAr: string;
  descriptionEn: string;
  rate: number;
  isLocalCurrency: boolean;
}

export interface CurrencySelection {
  id: number;
  code: string;
}
