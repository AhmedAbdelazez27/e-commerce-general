import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { AuthTokenService } from '../../../../core/services/auth-token.service';
import { CurrencyCodeComponent } from '../../../../shared/components/currency-code/currency-code.component';
import { formatProductPrice } from '../../../../shared/utils/product-card.util';
import { RETURN_STATUSES } from '../../config/return-status.config';
import type { EcReturnDto, ReturnListFilter } from '../../models/return.model';
import { ReturnsApiService } from '../../services/returns-api.service';
import {
  filterReturns,
  isAcceptedReturn,
  isRejectedReturn,
  isUnderReviewReturn,
  returnStatusChipClass,
  returnStatusDisplayName,
} from '../../utils/return.util';

@Component({
  selector: 'app-returns-page',
  imports: [RouterLink, TranslateModule, DatePipe, NgClass, CurrencyCodeComponent],
  templateUrl: './returns-page.component.html',
})
export class ReturnsPageComponent {
  private readonly returnsApi = inject(ReturnsApiService);
  private readonly auth = inject(AuthTokenService);
  private readonly translate = inject(TranslateService);

  readonly statusFilters = RETURN_STATUSES;
  readonly loading = signal(true);
  readonly returns = signal<EcReturnDto[]>([]);
  readonly filter = signal<ReturnListFilter>('all');

  readonly isArabic = computed(() => (this.translate.currentLang ?? '').toLowerCase().startsWith('ar'));

  readonly underReviewReturns = computed(() => this.returns().filter(isUnderReviewReturn));
  readonly acceptedReturns = computed(() => this.returns().filter(isAcceptedReturn));
  readonly rejectedReturns = computed(() => this.returns().filter(isRejectedReturn));
  readonly filteredReturns = computed(() => filterReturns(this.returns(), this.filter()));

  constructor() {
    this.load();
  }

  reload(): void {
    this.load();
  }

  setFilter(next: ReturnListFilter): void {
    this.filter.set(next);
  }

  filterCount(next: ReturnListFilter): number {
    if (next === 'all') {
      return this.returns().length;
    }
    if (next === 'under_review') {
      return this.underReviewReturns().length;
    }
    if (next === 'accepted') {
      return this.acceptedReturns().length;
    }
    return this.rejectedReturns().length;
  }

  emptyMessageKey(): string {
    switch (this.filter()) {
      case 'under_review':
        return 'RETURNS.EMPTY_UNDER_REVIEW';
      case 'accepted':
        return 'RETURNS.EMPTY_ACCEPTED';
      case 'rejected':
        return 'RETURNS.EMPTY_REJECTED';
      default:
        return 'RETURNS.EMPTY_ALL';
    }
  }

  formatPrice(value: number | undefined): string {
    return formatProductPrice(value ?? 0);
  }

  statusName(ret: EcReturnDto): string {
    return returnStatusDisplayName(ret, this.isArabic());
  }

  statusChipClass(ret: EcReturnDto): string {
    return returnStatusChipClass(ret);
  }

  private load(): void {
    const customerId = this.resolveCustomerId();
    if (customerId <= 0) {
      this.returns.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.returnsApi
      .getCustomerReturns(customerId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => this.returns.set(result.items),
        error: () => this.returns.set([]),
      });
  }

  private resolveCustomerId(): number {
    const raw = this.auth.getCustomerId();
    if (!raw?.trim()) {
      return 0;
    }
    const id = Number(raw);
    return Number.isFinite(id) ? id : 0;
  }
}
