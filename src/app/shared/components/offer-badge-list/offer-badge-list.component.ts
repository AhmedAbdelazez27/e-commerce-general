import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { LanguageService } from '../../../core/services/language.service';
import type { PublicOfferBadge } from '../../models/promotion.model';
import {
  OfferRolePresentation,
  resolveOfferRolePresentation,
} from '../../utils/offer-presentation.util';

interface OfferBadgeEntry {
  offer: PublicOfferBadge;
  role: OfferRolePresentation;
}

@Component({
  selector: 'app-offer-badge-list',
  imports: [RouterLink, TranslateModule],
  templateUrl: './offer-badge-list.component.html',
  styleUrl: './offer-badge-list.component.scss',
})
export class OfferBadgeListComponent {
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  readonly offers = input<PublicOfferBadge[]>([]);
  readonly maxVisible = input(2);
  readonly expanded = signal(false);
  readonly badgeEntries = computed((): OfferBadgeEntry[] =>
    this.offers()
      .map((offer) => ({ offer, role: resolveOfferRolePresentation(offer.roles) }))
      .filter((entry): entry is OfferBadgeEntry => entry.role != null),
  );
  readonly visibleEntries = computed(() =>
    this.expanded()
      ? this.badgeEntries()
      : this.badgeEntries().slice(0, Math.max(1, this.maxVisible())),
  );
  readonly hiddenCount = computed(() =>
    Math.max(0, this.badgeEntries().length - this.visibleEntries().length),
  );

  name(offer: PublicOfferBadge): string {
    const primary = this.language.currentLang() === 'ar' ? offer.nameAr : offer.nameEn;
    const fallback = this.language.currentLang() === 'ar' ? offer.nameEn : offer.nameAr;
    return primary.trim() || fallback.trim() || this.translate.instant('OFFERS.LIMITED_OFFER');
  }

  toggleExpanded(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.expanded.update((value) => !value);
  }

  stopProductNavigation(event: MouseEvent): void {
    event.stopPropagation();
  }
}
