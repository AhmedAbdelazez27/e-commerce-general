import { Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, of } from 'rxjs';
import { debounceTime, filter, finalize, switchMap } from 'rxjs/operators';

import { LAYOUT_CONFIG } from '../config/layout.config';
import { SearchSuggestionsApiService } from '../services/search-suggestions-api.service';
import {
  SEARCH_SUGGESTION_DEBOUNCE_MS,
  SEARCH_SUGGESTION_MIN_LENGTH,
  moveSuggestionIndex,
} from '../utils/search-suggestions.util';
import { buildShopSearchQueryParams, shopPathname } from '../utils/shop-search-navigation.util';

let nextSearchId = 0;

@Component({
  selector: 'app-store-search',
  imports: [FormsModule, TranslateModule],
  host: {
    '[class.store-header__search]': 'variant() !== "drawer"',
    '[class.store-header__search--inline]': 'variant() === "inline"',
    '[class.store-drawer__search]': 'variant() === "drawer"',
  },
  template: `
    <form (submit)="submitSearch($event)" role="search">
      <div class="store-header__search-wrap">
        <input
          type="search"
          class="store-header__search-input"
          [name]="listId"
          [ngModel]="query"
          (ngModelChange)="onQueryChange($event)"
          (keydown)="onKeydown($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          [placeholder]="placeholderKey | translate"
          autocomplete="off"
          role="combobox"
          aria-autocomplete="list"
          [attr.aria-expanded]="listOpen()"
          [attr.aria-controls]="listOpen() ? listId : null"
          [attr.aria-activedescendant]="activeDescendant()"
        />
        <button type="submit" class="store-header__search-btn" [attr.aria-label]="'LAYOUT.HEADER.SEARCH' | translate">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        </button>
      </div>
      @if (listOpen()) {
        <ul
          class="store-search__list"
          role="listbox"
          [id]="listId"
          [attr.aria-label]="'LAYOUT.HEADER.SUGGESTIONS' | translate"
          [attr.aria-busy]="loading()"
        >
          @if (loading()) {
            <li class="store-search__status" role="presentation">
              <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
              <span class="ds-visually-hidden">{{ 'COMMON.LOADING' | translate }}</span>
            </li>
          } @else {
            @for (name of suggestions(); track name; let index = $index) {
              <li
                class="store-search__option"
                role="option"
                [id]="optionId(index)"
                [class.is-active]="index === activeIndex()"
                [attr.aria-selected]="index === activeIndex()"
                (mousedown)="selectSuggestion($event, name)"
              >
                {{ name }}
              </li>
            }
          }
        </ul>
      }
    </form>
  `,
})
export class StoreSearchComponent implements OnInit {
  private readonly api = inject(SearchSuggestionsApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queries = new Subject<string>();
  private readonly header = LAYOUT_CONFIG.header;
  private acceptResults = false;
  private focused = false;

  readonly variant = input<'inline' | 'bar' | 'drawer'>('bar');
  readonly searched = output<void>();

  readonly placeholderKey = LAYOUT_CONFIG.header.searchPlaceholderKey;
  readonly listId = `store-search-list-${++nextSearchId}`;
  readonly suggestions = signal<string[]>([]);
  readonly activeIndex = signal(-1);
  readonly listOpen = signal(false);
  readonly loading = signal(false);

  query = '';

  ngOnInit(): void {
    this.syncFromUrl();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.syncFromUrl());

    this.queries
      .pipe(
        debounceTime(SEARCH_SUGGESTION_DEBOUNCE_MS),
        switchMap((value) => {
          const text = value.trim();
          if (text.length < SEARCH_SUGGESTION_MIN_LENGTH) {
            this.loading.set(false);
            return of([] as string[]);
          }
          this.loading.set(true);
          if (this.focused) {
            this.listOpen.set(true);
          }
          return this.api.getSuggestions(text).pipe(finalize(() => this.loading.set(false)));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((names) => {
        if (!this.acceptResults) {
          return;
        }
        this.suggestions.set(names);
        this.activeIndex.set(-1);
        this.listOpen.set(names.length > 0 && this.focused);
      });
  }

  activeDescendant(): string | null {
    const index = this.activeIndex();
    return this.listOpen() && index >= 0 ? this.optionId(index) : null;
  }

  optionId(index: number): string {
    return `${this.listId}-${index}`;
  }

  onQueryChange(value: string): void {
    this.query = value;
    this.acceptResults = true;
    this.focused = true;
    if (value.trim().length < SEARCH_SUGGESTION_MIN_LENGTH) {
      this.suggestions.set([]);
      this.closeList();
    }
    this.queries.next(value);
  }

  onFocus(): void {
    this.focused = true;
    if (
      this.query.trim().length >= SEARCH_SUGGESTION_MIN_LENGTH &&
      (this.loading() || this.suggestions().length > 0)
    ) {
      this.listOpen.set(true);
    }
  }

  onBlur(): void {
    this.focused = false;
    this.closeList();
  }

  onKeydown(event: KeyboardEvent): void {
    const count = this.suggestions().length;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (count === 0) {
        return;
      }
      event.preventDefault();
      this.listOpen.set(true);
      this.activeIndex.set(moveSuggestionIndex(this.activeIndex(), event.key === 'ArrowDown' ? 1 : -1, count));
      this.scrollActiveIntoView();
      return;
    }
    if (event.key === 'Escape' && this.listOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.closeList();
      return;
    }
    if (event.key === 'Enter' && this.listOpen() && this.activeIndex() >= 0) {
      const name = this.suggestions()[this.activeIndex()];
      if (!name) {
        return;
      }
      event.preventDefault();
      this.applySuggestion(name);
    }
  }

  selectSuggestion(event: Event, name: string): void {
    event.preventDefault();
    this.applySuggestion(name);
  }

  submitSearch(event: Event): void {
    event.preventDefault();
    this.navigate(this.query);
  }

  private applySuggestion(name: string): void {
    this.query = name;
    this.closeList();
    this.suggestions.set([]);
    this.navigate(name);
  }

  private navigate(searchText: string): void {
    this.acceptResults = false;
    const queryParams = buildShopSearchQueryParams(
      shopPathname(this.router.url),
      this.router.parseUrl(this.router.url).queryParams,
      this.header.shopRoute,
      searchText,
    );
    this.searched.emit();
    void this.router.navigate([this.header.shopRoute], { queryParams });
  }

  private syncFromUrl(): void {
    this.acceptResults = false;
    const q = this.router.parseUrl(this.router.url).queryParams['q'];
    this.query = typeof q === 'string' ? q : '';
    this.suggestions.set([]);
    this.closeList();
  }

  private closeList(): void {
    this.listOpen.set(false);
    this.activeIndex.set(-1);
  }

  private scrollActiveIntoView(): void {
    const index = this.activeIndex();
    if (index < 0) {
      return;
    }
    queueMicrotask(() => {
      document.getElementById(this.optionId(index))?.scrollIntoView({ block: 'nearest' });
    });
  }
}
