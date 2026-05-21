import { AppLang } from '../services/language.service';
import { ProductListItemDto } from '../../features/catalog/models/product.model';

export function productDisplayName(product: ProductListItemDto, lang: AppLang): string {
  return lang === 'ar' ? product.NameAr || product.NameEn : product.NameEn || product.NameAr;
}
