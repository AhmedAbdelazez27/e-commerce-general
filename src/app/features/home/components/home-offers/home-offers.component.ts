import { Component, ElementRef, computed, effect, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { HomeOfferCard } from '../../models/home.model';
import { productRailEdges, slideProductRail } from '../../utils/home-product-rail.util';

@Component({
  selector: 'app-home-offers',
  imports: [RouterLink, TranslateModule],
  templateUrl: './home-offers.component.html',
  styleUrl: './home-offers.component.scss',
})
export class HomeOffersComponent {
  readonly offers = input.required<HomeOfferCard[]>();

  private readonly rail = viewChild<ElementRef<HTMLElement>>('rail');
  readonly canPrev = signal(false);
  readonly canNext = signal(false);
  readonly sliderOverflow = computed(() => this.canPrev() || this.canNext());

  constructor() {
    effect((onCleanup) => {
      const rail = this.rail()?.nativeElement;
      this.offers();
      if (!rail) {
        return;
      }

      const sync = () => this.syncRail();
      rail.scrollLeft = 0;
      const observer = new ResizeObserver(sync);
      observer.observe(rail);
      const frame = requestAnimationFrame(sync);
      onCleanup(() => {
        cancelAnimationFrame(frame);
        observer.disconnect();
      });
    });
  }

  slide(direction: -1 | 1): void {
    const rail = this.rail()?.nativeElement;
    if (!rail) {
      return;
    }

    slideProductRail(rail, direction, '.home-offers-slider__item');
  }

  syncRail(): void {
    const rail = this.rail()?.nativeElement;
    if (!rail) {
      this.canPrev.set(false);
      this.canNext.set(false);
      return;
    }

    const edges = productRailEdges(rail);
    this.canPrev.set(edges.canPrev);
    this.canNext.set(edges.canNext);
  }
}
