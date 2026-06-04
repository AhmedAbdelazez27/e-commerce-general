import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { formatProductPrice } from '../../../../shared/utils/product-card.util';
import type { EcOrderDto } from '../../models/place-order.model';
import { CheckoutStateService } from '../../services/checkout-state.service';

@Component({
  selector: 'app-order-success',
  imports: [RouterLink, TranslateModule],
  templateUrl: './order-success.component.html',
})
export class OrderSuccessComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly checkoutState = inject(CheckoutStateService);

  readonly order = signal<EcOrderDto | null>(null);

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const fromState = (nav?.extras.state?.['order'] ?? history.state?.['order']) as EcOrderDto | undefined;
    const order = fromState ?? this.checkoutState.lastPlacedOrder();
    if (!order?.orderNumber) {
      void this.router.navigate(['/home']);
      return;
    }
    this.order.set(order);
    this.checkoutState.reset();
  }

  formatPrice(value: number | undefined): string {
    return formatProductPrice(value ?? 0);
  }
}
