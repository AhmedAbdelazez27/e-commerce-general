import type { AppLang } from '../../../core/services/language.service';
import { PublicFaqDto } from '../../../layout/models/catalog-public.model';

export interface FaqCategoryOption {
  id: number;
  categoryNameAr: string;
  categoryNameEn: string;
}

export interface FaqCategoryGroup {
  categoryLkpId: number;
  categoryNameAr: string;
  categoryNameEn: string;
  faqs: PublicFaqDto[];
}

export function faqQuestion(faq: PublicFaqDto, lang: AppLang): string {
  if (lang === 'ar') {
    return faq.questionAr?.trim() || faq.questionEn?.trim() || '';
  }
  return faq.questionEn?.trim() || faq.questionAr?.trim() || '';
}

export function faqAnswer(faq: PublicFaqDto, lang: AppLang): string {
  if (lang === 'ar') {
    return faq.answerAr?.trim() || faq.answerEn?.trim() || '';
  }
  return faq.answerEn?.trim() || faq.answerAr?.trim() || '';
}

export function faqCategoryName(
  faq: Pick<PublicFaqDto, 'categoryNameAr' | 'categoryNameEn'>,
  lang: AppLang,
): string {
  if (lang === 'ar') {
    return faq.categoryNameAr?.trim() || faq.categoryNameEn?.trim() || '';
  }
  return faq.categoryNameEn?.trim() || faq.categoryNameAr?.trim() || '';
}

export function mapLookupToFaqCategory(item: {
  id: number;
  nameEn: string;
  nameAr: string;
}): FaqCategoryOption {
  return {
    id: item.id,
    categoryNameEn: item.nameEn,
    categoryNameAr: item.nameAr,
  };
}

export function sortFaqCategories(categories: FaqCategoryOption[]): FaqCategoryOption[] {
  return [...categories].sort((a, b) =>
    (a.categoryNameEn || a.categoryNameAr).localeCompare(
      b.categoryNameEn || b.categoryNameAr,
      undefined,
      { sensitivity: 'base' },
    ),
  );
}

export function extractFaqCategories(faqs: PublicFaqDto[]): FaqCategoryOption[] {
  const byId = new Map<number, FaqCategoryOption>();

  for (const faq of faqs) {
    if (!byId.has(faq.categoryLkpId)) {
      byId.set(faq.categoryLkpId, {
        id: faq.categoryLkpId,
        categoryNameAr: faq.categoryNameAr,
        categoryNameEn: faq.categoryNameEn,
      });
    }
  }

  return [...byId.values()].sort((a, b) =>
    (a.categoryNameEn || a.categoryNameAr).localeCompare(
      b.categoryNameEn || b.categoryNameAr,
      undefined,
      { sensitivity: 'base' },
    ),
  );
}

export function groupFaqsByCategory(faqs: PublicFaqDto[]): FaqCategoryGroup[] {
  const byCategory = new Map<number, FaqCategoryGroup>();

  for (const faq of faqs) {
    let group = byCategory.get(faq.categoryLkpId);
    if (!group) {
      group = {
        categoryLkpId: faq.categoryLkpId,
        categoryNameAr: faq.categoryNameAr,
        categoryNameEn: faq.categoryNameEn,
        faqs: [],
      };
      byCategory.set(faq.categoryLkpId, group);
    }
    group.faqs.push(faq);
  }

  return [...byCategory.values()].sort((a, b) =>
    (a.categoryNameEn || a.categoryNameAr).localeCompare(
      b.categoryNameEn || b.categoryNameAr,
      undefined,
      { sensitivity: 'base' },
    ),
  );
}
