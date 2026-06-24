import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { ToastService } from '../../../../core/services/toast.service';
import { LanguageService } from '../../../../core/services/language.service';
import { FndLookupApiService } from '../../../../core/services/fnd-lookup-api.service';
import { CatalogBreadcrumbComponent } from '../../../catalog/components/catalog-breadcrumb/catalog-breadcrumb.component';
import { CatalogBreadcrumbItem } from '../../../catalog/models/catalog-listing.model';
import { EcPublicCatalogApiService } from '../../../../layout/services/ec-public-catalog-api.service';
import { PublicFaqDto } from '../../../../layout/models/catalog-public.model';
import {
  faqAnswer,
  faqCategoryName,
  faqQuestion,
  FaqCategoryOption,
  groupFaqsByCategory,
  mapLookupToFaqCategory,
  sortFaqCategories,
} from '../../utils/faq-display.util';
import { getFaqVotedIds, markFaqVoted } from '../../utils/faq-vote-storage.util';

@Component({
  selector: 'app-faq-page',
  imports: [TranslateModule, FormsModule, CatalogBreadcrumbComponent],
  templateUrl: './faq-page.component.html',
})
export class FaqPageComponent {
  private readonly catalogApi = inject(EcPublicCatalogApiService);
  private readonly lookupApi = inject(FndLookupApiService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  private searchDebounce?: ReturnType<typeof setTimeout>;

  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly faqs = signal<PublicFaqDto[]>([]);
  readonly categories = signal<FaqCategoryOption[]>([]);
  readonly searchText = signal('');
  readonly selectedCategoryId = signal<number | null>(null);
  readonly votingId = signal<number | null>(null);
  readonly votedIds = signal<Set<number>>(getFaqVotedIds());

  readonly groupedFaqs = computed(() => groupFaqsByCategory(this.faqs()));
  readonly showGroupTitles = computed(() => this.selectedCategoryId() == null);
  readonly openFaqId = signal<number | null>(null);

  readonly breadcrumbs: CatalogBreadcrumbItem[] = [
    { labelKey: 'PAGE.HOME', route: '/home' },
    { labelKey: 'PAGE.FAQ', current: true },
  ];

  constructor() {
    this.loadCategories();
    this.loadFaqs();
    this.translate.onLangChange.subscribe(() => this.reloadCurrent());
  }

  question(faq: PublicFaqDto): string {
    return faqQuestion(faq, this.language.currentLang());
  }

  answer(faq: PublicFaqDto): string {
    return faqAnswer(faq, this.language.currentLang());
  }

  categoryLabel(category: FaqCategoryOption): string {
    return faqCategoryName(category, this.language.currentLang());
  }

  groupTitle(group: { categoryNameAr: string; categoryNameEn: string }): string {
    return faqCategoryName(group, this.language.currentLang());
  }

  hasVoted(faqId: number): boolean {
    return this.votedIds().has(faqId);
  }

  isVoting(faqId: number): boolean {
    return this.votingId() === faqId;
  }

  isDefaultOpen(faqId: number): boolean {
    return this.openFaqId() === faqId;
  }

  onFaqToggle(faqId: number, event: Event): void {
    const details = event.target as HTMLDetailsElement;
    if (!details.open && this.openFaqId() === faqId) {
      this.openFaqId.set(null);
    }
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId.set(categoryId);
    this.reloadCurrent();
  }

  onSearchInput(value: string): void {
    this.searchText.set(value);
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.reloadCurrent(), 400);
  }

  vote(faq: PublicFaqDto, isHelpful: boolean): void {
    if (this.hasVoted(faq.id) || this.isVoting(faq.id)) {
      return;
    }

    this.votingId.set(faq.id);
    this.catalogApi
      .rateFaq({ id: faq.id, isHelpful })
      .pipe(finalize(() => this.votingId.set(null)))
      .subscribe({
        next: () => {
          this.faqs.update((items) =>
            items.map((item) => {
              if (item.id !== faq.id) {
                return item;
              }
              return {
                ...item,
                helpfulCount: isHelpful ? item.helpfulCount + 1 : item.helpfulCount,
                notHelpfulCount: !isHelpful ? item.notHelpfulCount + 1 : item.notHelpfulCount,
              };
            }),
          );
          markFaqVoted(faq.id);
          this.votedIds.set(getFaqVotedIds());
        },
        error: () => {
          this.toast.error(this.translate.instant('FAQ.VOTE_FAILED'));
        },
      });
  }

  mediaUrl(value: string | null | undefined): string | null {
    return value?.trim() || null;
  }

  private reloadCurrent(): void {
    const query = this.searchText().trim();
    if (query) {
      this.searchFaqs(query);
      return;
    }
    this.loadFaqs();
  }

  private loadCategories(): void {
    this.lookupApi.getFaqCategories().subscribe({
      next: (items) => {
        this.categories.set(sortFaqCategories(items.map(mapLookupToFaqCategory)));
      },
      error: () => {
        this.categories.set([]);
      },
    });
  }

  private loadFaqs(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    const categoryId = this.selectedCategoryId();

    this.catalogApi
      .getFaqs(categoryId ?? undefined)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.faqs.set(items);
          this.openFaqId.set(items[0]?.id ?? null);
        },
        error: () => {
          this.faqs.set([]);
          this.loadFailed.set(true);
        },
      });
  }

  private searchFaqs(query: string): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    const categoryId = this.selectedCategoryId();

    this.catalogApi
      .searchFaqs({
        searchText: query,
        ...(categoryId != null ? { categoryLkpId: categoryId } : {}),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.faqs.set(items);
          this.openFaqId.set(items[0]?.id ?? null);
        },
        error: () => {
          this.faqs.set([]);
          this.loadFailed.set(true);
        },
      });
  }
}
