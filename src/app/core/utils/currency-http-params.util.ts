import { HttpParams } from '@angular/common/http';

import type { CurrencySelection } from '../models/currency.model';
import { withCurrencyQueryParams } from './currency-api.util';

export function appendCurrencyToHttpParams(
  params: HttpParams,
  currency?: CurrencySelection | null,
): HttpParams {
  if (currency && currency.id > 0 && currency.code.trim()) {
    return withCurrencyQueryParams(params, currency);
  }
  return params;
}
