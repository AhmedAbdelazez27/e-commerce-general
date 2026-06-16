import type { AppLang } from '../../../core/services/language.service';
import { PublicSearchProductDto } from '../../catalog/models/catalog-public-listing.model';
import { HomeCuratedCollection } from '../models/home.model';

const CURATED_IMAGE_PLACEHOLDER = '/images/category-placeholder.svg';

function localizedName(item: PublicSearchProductDto, lang: AppLang): string {
  if (lang === 'ar') {
    return item.nameAr?.trim() || item.name?.trim() || '';
  }
  return item.nameEn?.trim() || item.name?.trim() || '';
}

function localizedBrand(item: PublicSearchProductDto, lang: AppLang): string {
  if (lang === 'ar') {
    return item.brandNameAr?.trim() || item.brandName?.trim() || '';
  }
  return item.brandNameEn?.trim() || item.brandName?.trim() || '';
}

function localizedCategory(item: PublicSearchProductDto, lang: AppLang): string {
  if (lang === 'ar') {
    return item.categoryNameAr?.trim() || item.categoryName?.trim() || '';
  }
  return item.categoryNameEn?.trim() || item.categoryName?.trim() || '';
}

export function mapFeaturedProductToCuratedCollection(
  item: PublicSearchProductDto,
  lang: AppLang,
): HomeCuratedCollection {
  const name = localizedName(item, lang);
  const productId = item.productId ?? item.id;
  const eyebrow = localizedBrand(item, lang) || localizedCategory(item, lang);

  return {
    id: String(productId),
    eyebrow,
    title: name,
    hoverCtaKey: 'HOME.CURATED.CTA',
    imageUrl: item.mainImageUrl?.trim() || CURATED_IMAGE_PLACEHOLDER,
    imageAlt: name,
    route: `/shop/${productId}`,
  };
}

export function mapFeaturedProductsToCuratedCollections(
  items: PublicSearchProductDto[],
  lang: AppLang,
): HomeCuratedCollection[] {
  return items.map((item) => mapFeaturedProductToCuratedCollection(item, lang));
}
