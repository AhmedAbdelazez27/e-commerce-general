import { describe, expect, it } from 'vitest';
import { PublicCategoryDto } from '../../layout/models/catalog-public.model';
import { featuredCategoryPreview, visibleCategoryTree } from './category-visibility.util';

function category(id: number, overrides: Partial<PublicCategoryDto> = {}): PublicCategoryDto {
  return {
    id,
    parentCategoryId: null,
    name: `Category ${id}`,
    nameEn: `Category ${id}`,
    nameAr: `فئة ${id}`,
    slug: `category-${id}`,
    isFeatured: false,
    sortOrder: id,
    count: 1,
    children: [],
    ...overrides,
  };
}

describe('category visibility', () => {
  it('removes empty roots and nested branches without changing the API tree', () => {
    const tree = [
      category(1, { count: 0 }),
      category(2, {
        count: 3,
        children: [category(3, { count: 0 }), category(4, { count: 3 })],
      }),
    ];
    const visible = visibleCategoryTree(tree);
    expect(visible.map((node) => node.id)).toEqual([2]);
    expect(visible[0].children.map((node) => node.id)).toEqual([4]);
    expect(visible[0].count).toBe(3);
    expect(tree[1].children).toHaveLength(2);
  });

  it('keeps the path to populated descendants even if a parent reports zero', () => {
    const result = visibleCategoryTree([
      category(1, {
        count: 0,
        children: [category(2, { count: 0, children: [category(3, { count: 2 })] })],
      }),
    ]);
    expect(result[0].count).toBe(2);
    expect(result[0].children[0].children[0].id).toBe(3);
  });

  it('preserves older categories whose product count is unavailable', () => {
    expect(visibleCategoryTree([category(1, { count: undefined })])).toHaveLength(1);
  });

  it('limits 56 roots to six with featured categories first, then display order', () => {
    const tree = Array.from({ length: 56 }, (_, i) =>
      category(i + 1, {
        isFeatured: i === 55 || i === 49,
      }),
    );
    expect(featuredCategoryPreview(tree).map((node) => node.id)).toEqual([50, 56, 1, 2, 3, 4]);
    expect(tree[0].id).toBe(1);
    expect(visibleCategoryTree(tree)).toHaveLength(56);
  });

  it('excludes empty featured categories before applying the limit', () => {
    const tree = [category(1, { count: 0, isFeatured: true }), category(2), category(3)];
    expect(featuredCategoryPreview(tree, 1).map((node) => node.id)).toEqual([2]);
    expect(featuredCategoryPreview(tree, 0)).toEqual([]);
    expect(featuredCategoryPreview([])).toEqual([]);
  });
});
