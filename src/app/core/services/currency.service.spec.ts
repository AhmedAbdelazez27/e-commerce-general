import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EcPublicCatalogApiService } from '../../layout/services/ec-public-catalog-api.service';
import { CurrencyService } from './currency.service';

describe('CurrencyService legacy currency codes', () => {
  beforeEach(() => {
    localStorage.removeItem('app_currency');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EcPublicCatalogApiService,
          useValue: {
            getCurrencies: () =>
              of([
                { id: 1, code: 'AED', isLocalCurrency: true },
                { id: 2, code: 'JD', isLocalCurrency: false },
                { id: 3, code: 'USD', isLocalCurrency: false },
              ]),
          },
        },
      ],
    });
  });

  afterEach(() => localStorage.removeItem('app_currency'));

  it('includes JD and restores it after a page reload', async () => {
    localStorage.setItem('app_currency', JSON.stringify({ id: 2, code: 'JD' }));
    const service = TestBed.inject(CurrencyService);
    await service.ensureLoaded();
    expect(service.currencies().map((currency) => currency.code)).toEqual(['AED', 'JD', 'USD']);
    expect(service.selection()).toMatchObject({ id: 2, code: 'JD' });
  });

  it('emits and persists the ERP ID and JD code when selected', async () => {
    const service = TestBed.inject(CurrencyService);
    await service.ensureLoaded();
    let changed: unknown;
    const subscription = service.currencyChanged$.subscribe((value) => (changed = value));
    service.setCurrency(service.currencies()[1]);
    expect(changed).toEqual({ id: 2, code: 'JD' });
    expect(JSON.parse(localStorage.getItem('app_currency')!)).toEqual({ id: 2, code: 'JD' });
    subscription.unsubscribe();
  });

  it('does not restore a stored currency that is absent from the API', async () => {
    localStorage.setItem('app_currency', JSON.stringify({ id: 99, code: 'JD' }));
    const service = TestBed.inject(CurrencyService);
    await service.ensureLoaded();
    expect(service.selection()).toEqual({ id: 1, code: 'AED' });
  });
});
