export interface ProductListItemDto {
  Id: number;
  NameEn: string;
  NameAr: string;
  Price: number;
  ImageUrl?: string;
  CategoryName?: string;
}

export interface ProductDetailDto extends ProductListItemDto {
  DescriptionEn?: string;
  DescriptionAr?: string;
  Sku?: string;
  StockQuantity?: number;
}

export interface CategoryDto {
  Id: number;
  NameEn: string;
  NameAr: string;
  Children?: CategoryDto[];
}
