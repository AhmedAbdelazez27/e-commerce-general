import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { OrderListItemDto } from '../../models/order.model';
import { AccountApiService } from '../../services/account-api.service';

@Component({
  selector: 'app-orders-page',
  imports: [DatePipe, DecimalPipe, TranslateModule],
  templateUrl: './orders-page.component.html',
})
export class OrdersPageComponent implements OnInit {
  private readonly accountApi = inject(AccountApiService);

  protected readonly orders = signal<OrderListItemDto[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.accountApi.getMyOrders().subscribe({
      next: (items) => {
        this.orders.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
