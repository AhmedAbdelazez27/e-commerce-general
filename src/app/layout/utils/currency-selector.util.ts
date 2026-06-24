import type { AppLang } from '../../core/services/language.service';
import type { PublicCurrencyDto } from '../../core/models/currency.model';

export function currencyOptionLabel(currency: PublicCurrencyDto, lang: AppLang): string {
  const name = lang === 'ar' ? currency.descriptionAr : currency.descriptionEn;
  return `${currency.code} — ${name}`;
}

export function currencyFromSelectValue(
  currencies: PublicCurrencyDto[],
  value: string,
): PublicCurrencyDto | undefined {
  const id = Number(value);
  if (!Number.isFinite(id) || id <= 0) {
    return undefined;
  }
  return currencies.find((c) => c.id === id);
}
