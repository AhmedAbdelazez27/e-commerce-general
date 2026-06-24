import { HttpParams } from '@angular/common/http';

import type { CurrencySelection } from '../models/currency.model';

export function withCurrencyBody<T extends object>(
  body: T,
  currency: CurrencySelection,
): T & { currencyId: number; currencyCode: string } {
  return {
    ...body,
    currencyId: currency.id,
    currencyCode: currency.code,
  };
}

export function withCurrencyQueryParams(
  params: HttpParams,
  currency: CurrencySelection,
): HttpParams {
  return params.set('CurrencyId', String(currency.id)).set('CurrencyCode', currency.code);
}
