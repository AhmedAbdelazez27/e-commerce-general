import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { LanguageService } from '../../../../core/services/language.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import type { OfferDefinition } from '../../../../shared/models/promotion.model';
import { resolveOfferBenefitPresentation } from '../../../../shared/utils/offer-presentation.util';
import { EcPromotionsApiService } from '../../services/ec-promotions-api.service';

@Component({
  selector: 'app-offers-page',
  imports: [RouterLink, TranslateModule],
  templateUrl: './offers-page.component.html',
})
export class OffersPageComponent implements OnInit {
  private readonly api = inject(EcPromotionsApiService);
  private readonly language = inject(LanguageService);
  private readonly currency = inject(CurrencyService);
  private readonly translateService = inject(TranslateService);
  private readonly pageSize = 12;

  readonly offers = signal<OfferDefinition[]>([]);
  readonly totalCount = signal(0);
  readonly skipCount = signal(0);
  readonly loading = signal(false);
  readonly loadFailed = signal(false);
  readonly pageNumber = computed(() => Math.floor(this.skipCount() / this.pageSize) + 1);
  readonly hasPrevious = computed(() => this.skipCount() > 0);
  readonly hasNext = computed(() => this.skipCount() + this.pageSize < this.totalCount());

  ngOnInit(): void {
    this.load();
  }

  name(offer: OfferDefinition): string {
    return this.localized(
      offer.nameAr,
      offer.nameEn,
      this.translateService.instant('OFFERS.LIMITED_OFFER'),
    );
  }

  description(offer: OfferDefinition): string {
    return this.localized(offer.descriptionAr, offer.descriptionEn, '');
  }

  benefit(offer: OfferDefinition): string {
    const presentation = resolveOfferBenefitPresentation(offer, this.currency.selection());
    return this.translateService.instant(presentation.key, presentation.params);
  }

  dateText(offer: OfferDefinition): string {
    if (offer.startDate && offer.endDate) {
      return this.translateService.instant('OFFERS.VALID_FROM_TO', {
        from: this.formatBusinessDate(offer.startDate),
        to: this.formatBusinessDate(offer.endDate),
      });
    }
    if (offer.endDate) {
      return this.translateService.instant('OFFERS.VALID_UNTIL', {
        date: this.formatBusinessDate(offer.endDate),
      });
    }
    return this.translateService.instant('OFFERS.VALID_FROM', {
      date: this.formatBusinessDate(offer.startDate),
    });
  }

  previous(): void {
    if (!this.hasPrevious()) return;
    this.skipCount.update((value) => Math.max(0, value - this.pageSize));
    this.load();
  }

  next(): void {
    if (!this.hasNext()) return;
    this.skipCount.update((value) => value + this.pageSize);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api
      .getOffers(this.skipCount(), this.pageSize)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          this.offers.set(result.items);
          this.totalCount.set(result.totalCount);
        },
        error: () => {
          this.offers.set([]);
          this.totalCount.set(0);
          this.loadFailed.set(true);
        },
      });
  }

  private localized(ar: string | undefined, en: string | undefined, fallback: string): string {
    const primary = this.language.currentLang() === 'ar' ? ar : en;
    const secondary = this.language.currentLang() === 'ar' ? en : ar;
    return primary?.trim() || secondary?.trim() || fallback;
  }

  private formatBusinessDate(value: string | undefined): string {
    if (!value) return '';
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return value;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return new Intl.DateTimeFormat(this.language.currentLang() === 'ar' ? 'ar-AE' : 'en-AE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
}
