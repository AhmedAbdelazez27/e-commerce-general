import { normalizePublicCurrencyDto } from './currency-api.mapper';

describe('currency-api.mapper', () => {
  it('preserves the ERP JD code and currency ID', () => {
    expect(
      normalizePublicCurrencyDto({ id: 7, code: ' jd ', isLocalCurrency: true }),
    ).toMatchObject({ id: 7, code: 'JD', isLocalCurrency: true });
  });

  it('still rejects missing codes, invalid characters, and invalid IDs', () => {
    for (const code of ['', ' ', 'J', 'J1', 'J-D', 'DOLLAR']) {
      expect(normalizePublicCurrencyDto({ id: 7, code })).toBeNull();
    }
    expect(normalizePublicCurrencyDto({ id: 0, code: 'JD' })).toBeNull();
  });

  it('normalizes currency from PascalCase API fields', () => {
    const currency = normalizePublicCurrencyDto({
      Id: 2,
      Code: 'usd',
      DescriptionAr: 'دولار',
      DescriptionEn: 'US Dollar',
      Rate: 0.71,
      IsLocalCurrency: false,
    });

    expect(currency).toEqual({
      id: 2,
      code: 'USD',
      descriptionAr: 'دولار',
      descriptionEn: 'US Dollar',
      rate: 0.71,
      isLocalCurrency: false,
    });
  });
});
