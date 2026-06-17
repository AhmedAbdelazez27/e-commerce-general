import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { formatProductPrice } from '../../../../shared/utils/product-card.util';
import type { EcOrderDto, EcOrderStatusHistoryDto } from '../../../checkout/models/place-order.model';
import { AccountOrdersApiService } from '../../services/account-orders-api.service';
import {
  canLinkOrderItemToProduct,
  lineItemName,
  lineItemTotal,
  orderItemProductLink,
  orderPaymentMethodLabel,
  orderStatusDisplayName,
  orderTrackingSteps,
  sortStatusHistory,
  statusHistoryNotes,
  statusHistoryPrimaryLabel,
} from '../../utils/account-order.util';

@Component({
  selector: 'app-order-detail-page',
  imports: [RouterLink, TranslateModule, DatePipe],
  templateUrl: './order-detail-page.component.html',
})
export class OrderDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersApi = inject(AccountOrdersApiService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly order = signal<EcOrderDto | null>(null);
  readonly statusHistory = signal<EcOrderStatusHistoryDto[]>([]);

  readonly isArabic = computed(() => (this.translate.currentLang ?? '').toLowerCase().startsWith('ar'));

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const orderId = Number(params.get('orderId'));
      if (!Number.isFinite(orderId) || orderId <= 0) {
        this.loading.set(false);
        this.loadFailed.set(true);
        return;
      }
      this.load(orderId);
    });
  }

  reload(): void {
    const orderId = this.order()?.id;
    if (orderId) {
      this.load(orderId);
    }
  }

  formatPrice(value: number | undefined): string {
    return formatProductPrice(value ?? 0);
  }

  trackingSteps(order: EcOrderDto) {
    return orderTrackingSteps(order);
  }

  paymentMethodLabel(order: EcOrderDto): string {
    return orderPaymentMethodLabel(order, this.isArabic());
  }

  statusName(order: EcOrderDto, kind: 'order' | 'payment' | 'shipping'): string {
    return orderStatusDisplayName(order, kind, this.isArabic());
  }

  historyTitle(entry: EcOrderStatusHistoryDto): string {
    return statusHistoryPrimaryLabel(entry, this.isArabic());
  }

  historyNotes(entry: EcOrderStatusHistoryDto): string | null {
    return statusHistoryNotes(entry, this.isArabic());
  }

  lineName(item: NonNullable<EcOrderDto['items']>[number]): string {
    return lineItemName(item);
  }

  lineTotal(item: NonNullable<EcOrderDto['items']>[number]): number {
    return lineItemTotal(item);
  }

  canOpenProduct(item: NonNullable<EcOrderDto['items']>[number]): boolean {
    return canLinkOrderItemToProduct(item);
  }

  productLink(item: NonNullable<EcOrderDto['items']>[number]): string[] | null {
    return orderItemProductLink(item);
  }

  private load(orderId: number): void {
    this.loading.set(true);
    this.loadFailed.set(false);

    forkJoin({
      order: this.ordersApi.getOrderDetails(orderId),
      history: this.ordersApi.getOrderStatusHistory(orderId),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ order, history }) => {
          if (!order) {
            this.order.set(null);
            this.statusHistory.set([]);
            this.loadFailed.set(true);
            return;
          }

          this.order.set(order);
          const merged = history.length > 0 ? history : (order.statusHistory ?? []);
          this.statusHistory.set(sortStatusHistory(merged));
        },
        error: () => {
          this.order.set(null);
          this.statusHistory.set([]);
          this.loadFailed.set(true);
        },
      });
  }
}
