import { describe, expect, it } from 'vitest';

import { moveSuggestionIndex, readSearchSuggestionNames } from './search-suggestions.util';

describe('moveSuggestionIndex', () => {
  it('starts at the first or last row', () => {
    expect(moveSuggestionIndex(-1, 1, 3)).toBe(0);
    expect(moveSuggestionIndex(-1, -1, 3)).toBe(2);
  });

  it('stops at the ends of the list', () => {
    expect(moveSuggestionIndex(0, -1, 3)).toBe(0);
    expect(moveSuggestionIndex(2, 1, 3)).toBe(2);
  });
});

describe('readSearchSuggestionNames', () => {
  it('reads localized names from an ABP envelope and caps the list at 10', () => {
    const items = Array.from({ length: 12 }, (_, index) => ({
      nameAr: `عربي ${index}`,
      nameEn: `English ${index}`,
    }));
    expect(readSearchSuggestionNames({ result: { items } }, 'ar')).toEqual(
      items.slice(0, 10).map((item) => item.nameAr),
    );
    expect(readSearchSuggestionNames({ result: { items: items.slice(0, 1) } }, 'en')).toEqual([
      'English 0',
    ]);
  });

  it('falls back to name and skips blanks', () => {
    expect(
      readSearchSuggestionNames(
        { items: [{ name: 'Cream' }, { nameAr: '  ' }, 'كريم', { nameEn: 'Cream' }] },
        'en',
      ),
    ).toEqual(['Cream', 'كريم']);
  });
});
