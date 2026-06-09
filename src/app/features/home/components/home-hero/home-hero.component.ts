import {
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { LanguageService } from '../../../../core/services/language.service';
import { APP_ENVIRONMENT } from '../../../../core/tokens/app-environment.token';
import { EcPublicCatalogApiService } from '../../../../layout/services/ec-public-catalog-api.service';
import { HomeHeroConfig, HomeHeroSlide } from '../../models/home.model';
import { mapHomeSlidersToHeroSlides } from '../../utils/home-slider.mapper';

const DEFAULT_AUTO_PLAY_MS = 6000;

@Component({
  selector: 'app-home-hero',
  imports: [RouterLink, TranslateModule],
  templateUrl: './home-hero.component.html',
  host: {
    '(mouseenter)': 'pauseAutoPlay()',
    '(mouseleave)': 'resumeAutoPlay()',
    '(focusin)': 'pauseAutoPlay()',
    '(focusout)': 'onHostFocusOut($event)',
  },
})
export class HomeHeroComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly catalogApi = inject(EcPublicCatalogApiService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private readonly env = inject(APP_ENVIRONMENT);

  readonly config = input.required<HomeHeroConfig>();

  readonly activeIndex = signal(0);
  readonly apiSlides = signal<HomeHeroSlide[]>([]);
  readonly loading = signal(true);

  readonly slides = computed(() => {
    const fromApi = this.apiSlides();
    if (fromApi.length > 0) {
      return fromApi;
    }
    return this.config().slides ?? [];
  });
  readonly slideCount = computed(() => this.slides().length);
  readonly hasMultipleSlides = computed(() => this.slideCount() > 1);

  private autoPlayTimer: ReturnType<typeof setInterval> | null = null;
  private autoPlayPaused = false;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearAutoPlay());
    this.loadSlides();
    this.translate.onLangChange.subscribe(() => this.loadSlides());

    effect(() => {
      const cfg = this.config();
      const count = this.slides().length;

      untracked(() => {
        this.activeIndex.update((index) => (index >= count ? 0 : index));
        const intervalMs = cfg.autoPlay === false || this.prefersReducedMotion() ? null : (cfg.autoPlayIntervalMs ?? DEFAULT_AUTO_PLAY_MS);
        this.restartAutoPlay(intervalMs);
      });
    });
  }

  goTo(index: number): void {
    const count = this.slideCount();
    if (count < 1) {
      return;
    }
    const next = ((index % count) + count) % count;
    this.activeIndex.set(next);
  }

  next(): void {
    this.goTo(this.activeIndex() + 1);
  }

  prev(): void {
    this.goTo(this.activeIndex() - 1);
  }

  pauseAutoPlay(): void {
    this.autoPlayPaused = true;
    this.clearAutoPlay();
  }

  resumeAutoPlay(): void {
    this.autoPlayPaused = false;
    const cfg = this.config();
    if (cfg.autoPlay === false || this.prefersReducedMotion()) {
      return;
    }
    this.restartAutoPlay(cfg.autoPlayIntervalMs ?? DEFAULT_AUTO_PLAY_MS);
  }

  imageAlt(slide: HomeHeroSlide): string {
    if (slide.imageAlt?.trim()) {
      return slide.imageAlt;
    }
    if (slide.imageAltKey) {
      return this.translate.instant(slide.imageAltKey);
    }
    return '';
  }

  headline(slide: HomeHeroSlide): string {
    if (slide.headline?.trim()) {
      return slide.headline;
    }
    if (slide.headlineKey) {
      return this.translate.instant(slide.headlineKey);
    }
    return '';
  }

  subtitle(slide: HomeHeroSlide): string {
    if (slide.subtitle?.trim()) {
      return slide.subtitle;
    }
    if (slide.subtitleKey) {
      return this.translate.instant(slide.subtitleKey);
    }
    return '';
  }

  ctaLabel(slide: HomeHeroSlide): string {
    if (slide.ctaLabel?.trim()) {
      return slide.ctaLabel;
    }
    if (slide.ctaLabelKey) {
      return this.translate.instant(slide.ctaLabelKey);
    }
    return '';
  }

  secondaryCtaLabel(slide: HomeHeroSlide): string {
    if (slide.secondaryCtaLabelKey) {
      return this.translate.instant(slide.secondaryCtaLabelKey);
    }
    return '';
  }

  eyebrow(slide: HomeHeroSlide): string {
    if (slide.eyebrowKey) {
      return this.translate.instant(slide.eyebrowKey);
    }
    return '';
  }

  onHostFocusOut(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement | null;
    if (host?.contains(event.relatedTarget as Node)) {
      return;
    }
    this.resumeAutoPlay();
  }

  private restartAutoPlay(intervalMs: number | null): void {
    this.clearAutoPlay();
    if (intervalMs == null || this.autoPlayPaused || this.slideCount() < 2) {
      return;
    }
    this.autoPlayTimer = setInterval(() => this.next(), intervalMs);
  }

  private clearAutoPlay(): void {
    if (this.autoPlayTimer != null) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  private prefersReducedMotion(): boolean {
    return this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  private loadSlides(): void {
    this.loading.set(true);
    const lang = this.language.apiCulture();

    this.catalogApi
      .getHomeSliders(lang)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.apiSlides.set(
            mapHomeSlidersToHeroSlides(items, this.language.currentLang(), this.env.apiBaseUrl),
          );
        },
        error: () => {
          this.apiSlides.set([]);
        },
      });
  }
}
