import type { AppLang } from '../../../core/services/language.service';
import { resolveAttachmentUrl } from '../../../core/utils/attachment-url.util';
import { PublicHomeSliderDto } from '../../../layout/models/catalog-public.model';
import { SHOP_ROUTE } from '../../../shared/utils/category-shop-link.util';
import { HomeHeroSlide } from '../models/home.model';

const SLIDER_PLACEHOLDER_IMAGE = '/images/HomeCover.png';

/** Collapse API line breaks so hero subtitles clamp cleanly in CSS. */
export function compactHeroSubtitle(text: string): string {
  return text.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Rewrite `localhost` attachment URLs to the ERP attachments host. */
export function resolveSliderImageUrl(
  imageUrl: string | null | undefined,
  mobileImageUrl: string | null | undefined,
  apiBaseUrl: string,
  preferMobile = false,
): string {
  const raw = preferMobile
    ? mobileImageUrl?.trim() || imageUrl?.trim()
    : imageUrl?.trim() || mobileImageUrl?.trim();
  if (!raw) {
    return SLIDER_PLACEHOLDER_IMAGE;
  }

  if (/^https?:\/\/localhost(\/|$)/i.test(raw)) {
    try {
      const api = new URL(apiBaseUrl);
      const path = raw.replace(/^https?:\/\/localhost/i, '');
      return `${api.protocol}//${api.hostname}:2042/ERPAttachments${path}`;
    } catch {
      return SLIDER_PLACEHOLDER_IMAGE;
    }
  }

  return resolveAttachmentUrl(raw) ?? SLIDER_PLACEHOLDER_IMAGE;
}

function localizedField(
  lang: AppLang,
  localized: { ar: string; en: string; fallback: string },
): string {
  const primary = lang === 'ar' ? localized.ar : localized.en;
  return primary.trim() || localized.fallback.trim();
}

function resolveSliderLink(dto: PublicHomeSliderDto): {
  route: string;
  queryParams?: Record<string, string>;
} {
  const type = dto.targetType?.trim().toLowerCase() ?? '';

  if (type === 'product' && dto.targetId > 0) {
    return { route: `${SHOP_ROUTE}/${dto.targetId}` };
  }

  if (type === 'category' && dto.targetId > 0) {
    return {
      route: SHOP_ROUTE,
      queryParams: {
        categoryId: String(dto.targetId),
        category: dto.targetSlug?.trim() || String(dto.targetId),
      },
    };
  }

  const link = dto.linkUrl?.trim();
  if (link) {
    const productMatch = link.match(/^\/product\/(\d+)$/i);
    if (productMatch) {
      return { route: `${SHOP_ROUTE}/${productMatch[1]}` };
    }

    const categoryMatch = link.match(/^\/category\/(.+)$/i);
    if (categoryMatch) {
      return {
        route: SHOP_ROUTE,
        queryParams: { category: categoryMatch[1] },
      };
    }

    if (link.startsWith('/')) {
      return { route: link };
    }
  }

  return { route: SHOP_ROUTE };
}

export function mapHomeSliderToHeroSlide(
  dto: PublicHomeSliderDto,
  lang: AppLang,
  apiBaseUrl: string,
): HomeHeroSlide {
  const title = localizedField(lang, {
    ar: dto.titleAr,
    en: dto.titleEn,
    fallback: dto.title,
  });
  const subtitle = compactHeroSubtitle(
    localizedField(lang, {
      ar: dto.subtitleAr,
      en: dto.subtitleEn,
      fallback: dto.subtitle,
    }),
  );
  const ctaLabel = localizedField(lang, {
    ar: dto.buttonTextAr,
    en: dto.buttonTextEn,
    fallback: dto.buttonText,
  });
  const { route, queryParams } = resolveSliderLink(dto);

  return {
    id: String(dto.id),
    imageSrc: resolveSliderImageUrl(dto.imageUrl, dto.mobileImageUrl, apiBaseUrl),
    imageAlt: title,
    headline: title,
    subtitle,
    ctaLabel,
    ctaRoute: route,
    ctaQuery: queryParams,
  };
}

export function mapHomeSlidersToHeroSlides(
  items: PublicHomeSliderDto[],
  lang: AppLang,
  apiBaseUrl: string,
): HomeHeroSlide[] {
  return [...items]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => mapHomeSliderToHeroSlide(item, lang, apiBaseUrl));
}
