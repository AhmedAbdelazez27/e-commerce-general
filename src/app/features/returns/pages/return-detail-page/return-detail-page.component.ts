import { DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { formatProductPrice } from '../../../../shared/utils/product-card.util';
import { CurrencyCodeComponent } from '../../../../shared/components/currency-code/currency-code.component';
import type { EcReturnDto } from '../../models/return.model';
import { ReturnsApiService } from '../../services/returns-api.service';
import {
  isAcceptedReturn,
  returnStatusChipClass,
  returnStatusDisplayName,
  returnTrackingSteps,
} from '../../utils/return.util';

@Component({
  selector: 'app-return-detail-page',
  imports: [RouterLink, TranslateModule, DatePipe, NgClass, CurrencyCodeComponent],
  templateUrl: './return-detail-page.component.html',
})
export class ReturnDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly returnsApi = inject(ReturnsApiService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly ret = signal<EcReturnDto | null>(null);

  readonly isArabic = computed(() => (this.translate.currentLang ?? '').toLowerCase().startsWith('ar'));

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const returnId = Number(params.get('returnId'));
      if (!Number.isFinite(returnId) || returnId <= 0) {
        this.loading.set(false);
        this.loadFailed.set(true);
        return;
      }
      this.load(returnId);
    });
  }

  reload(): void {
    const id = this.ret()?.id;
    if (id) {
      this.load(id);
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

  isAccepted(ret: EcReturnDto): boolean {
    return isAcceptedReturn(ret);
  }

  trackingSteps(ret: EcReturnDto) {
    return returnTrackingSteps(ret);
  }

  private load(returnId: number): void {
    this.loading.set(true);
    this.loadFailed.set(false);

    this.returnsApi
      .getReturn(returnId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (item) => {
          if (!item) {
            this.ret.set(null);
            this.loadFailed.set(true);
            return;
          }
          this.ret.set(item);
        },
        error: () => {
          this.ret.set(null);
          this.loadFailed.set(true);
        },
      });
  }
}
