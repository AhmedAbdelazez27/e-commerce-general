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
import { TranslateModule } from '@ngx-translate/core';

import { HomeHeroConfig } from '../../models/home.model';

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

  readonly config = input.required<HomeHeroConfig>();

  readonly activeIndex = signal(0);

  readonly slides = computed(() => this.config().slides);
  readonly slideCount = computed(() => this.slides().length);
  readonly hasMultipleSlides = computed(() => this.slideCount() > 1);

  private autoPlayTimer: ReturnType<typeof setInterval> | null = null;
  private autoPlayPaused = false;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearAutoPlay());

    effect(() => {
      const cfg = this.config();
      const count = cfg.slides.length;

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
}
