import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { AuthTokenService } from '../../../../core/services/auth-token.service';
import { formatProductPrice } from '../../../../shared/utils/product-card.util';
import type { EcReturnDto, ReturnListFilter } from '../../models/return.model';
import { ReturnsApiService } from '../../services/returns-api.service';
import {
  filterReturns,
  isActiveReturn,
  isCompletedReturn,
  returnStatusDisplayName,
} from '../../utils/return.util';

@Component({
  selector: 'app-returns-page',
  imports: [RouterLink, TranslateModule, DatePipe],
  templateUrl: './returns-page.component.html',
})
export class ReturnsPageComponent {
  private readonly returnsApi = inject(ReturnsApiService);
  private readonly auth = inject(AuthTokenService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly returns = signal<EcReturnDto[]>([]);
  readonly filter = signal<ReturnListFilter>('active');

  readonly isArabic = computed(() => (this.translate.currentLang ?? '').toLowerCase().startsWith('ar'));

  readonly activeReturns = computed(() => this.returns().filter(isActiveReturn));
  readonly completedReturns = computed(() => this.returns().filter(isCompletedReturn));
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

  formatPrice(value: number | undefined): string {
    return formatProductPrice(value ?? 0);
  }

  statusName(ret: EcReturnDto): string {
    return returnStatusDisplayName(ret, this.isArabic());
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
