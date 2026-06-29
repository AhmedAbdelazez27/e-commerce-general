import { normalizePublicCurrencyDto } from './currency-api.mapper';

describe('currency-api.mapper', () => {
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
