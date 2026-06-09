import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { AuthTokenService } from '../../../../core/services/auth-token.service';
import { formatProductPrice } from '../../../../shared/utils/product-card.util';
import type { EcOrderDto } from '../../../checkout/models/place-order.model';
import { AccountOrdersApiService } from '../../services/account-orders-api.service';
import {
  isActiveOrder,
  lineItemName,
  lineItemTotal,
  orderStatusLabelKey,
  orderTrackingSteps,
  type OrderListFilter,
} from '../../utils/account-order.util';

@Component({
  selector: 'app-orders-page',
  imports: [RouterLink, TranslateModule],
  templateUrl: './orders-page.component.html',
})
export class OrdersPageComponent {
  private readonly ordersApi = inject(AccountOrdersApiService);
  private readonly auth = inject(AuthTokenService);

  readonly loading = signal(true);
  readonly orders = signal<EcOrderDto[]>([]);
  readonly filter = signal<OrderListFilter>('active');

  readonly activeOrders = computed(() => this.orders().filter(isActiveOrder));
  readonly filteredOrders = computed(() =>
    this.filter() === 'active' ? this.activeOrders() : this.orders(),
  );

  constructor() {
    this.load();
  }

  reload(): void {
    this.load();
  }

  setFilter(next: OrderListFilter): void {
    this.filter.set(next);
  }

  formatPrice(value: number | undefined): string {
    return formatProductPrice(value ?? 0);
  }

  trackingSteps(order: EcOrderDto) {
    return orderTrackingSteps(order);
  }

  statusLabelKey(value: string | null | undefined): string | null {
    return orderStatusLabelKey(value);
  }

  lineName(item: NonNullable<EcOrderDto['items']>[number]): string {
    return lineItemName(item);
  }

  lineTotal(item: NonNullable<EcOrderDto['items']>[number]): number {
    return lineItemTotal(item);
  }

  private load(): void {
    const customerId = this.resolveCustomerId();
    if (customerId <= 0) {
      this.orders.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.ordersApi
      .getCustomerOrders(customerId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.orders.set(items),
        error: () => this.orders.set([]),
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
