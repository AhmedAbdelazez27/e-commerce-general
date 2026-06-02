import { AppLang } from '../../core/services/language.service';
import { NavLabelFields } from '../models/layout.model';

export function navItemLabel(
  item: NavLabelFields,
  lang: AppLang,
  translate: (key: string) => string,
): string {
  if (item.labelKey) {
    return translate(item.labelKey);
  }
  return lang === 'ar'
    ? (item.labelAr ?? item.labelEn ?? '')
    : (item.labelEn ?? item.labelAr ?? '');
}

export function navColumnTitle(
  column: { titleKey?: string; titleEn?: string; titleAr?: string },
  lang: AppLang,
  translate: (key: string) => string,
): string {
  if (column.titleKey) {
    return translate(column.titleKey);
  }
  return lang === 'ar'
    ? (column.titleAr ?? column.titleEn ?? '')
    : (column.titleEn ?? column.titleAr ?? '');
}
