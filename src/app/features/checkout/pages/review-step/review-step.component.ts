import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

import { AuthTokenService } from '../../../../core/services/auth-token.service';
import { CartService } from '../../../../core/services/cart.service';
import { enrichCartItems } from '../../../cart/utils/cart-enrichment.util';
import { CHECKOUT_CONFIG } from '../../config/checkout.config';
import { CheckoutOrderSummaryComponent } from '../../components/checkout-order-summary/checkout-order-summary.component';
import type { CustomerAddressDto } from '../../models/customer-address.model';
import { CheckoutApiService } from '../../services/checkout-api.service';
import { CheckoutStateService } from '../../services/checkout-state.service';
import { CustomerAddressApiService } from '../../services/customer-address-api.service';
import { formatAddressLines } from '../../utils/checkout-api.mapper';

@Component({
  selector: 'app-review-step',
  imports: [RouterLink, TranslateModule, CheckoutOrderSummaryComponent],
  templateUrl: './review-step.component.html',
})
export class ReviewStepComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);
  private readonly checkoutState = inject(CheckoutStateService);
  private readonly checkoutApi = inject(CheckoutApiService);
  private readonly addressApi = inject(CustomerAddressApiService);
  private readonly auth = inject(AuthTokenService);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);
  readonly placing = signal(false);
  readonly savedAddresses = signal<CustomerAddressDto[]>([]);

  readonly lineItems = computed(() => {
    const cart = this.cart.cart();
    if (!cart?.Items?.length) {
      return [];
    }
    return enrichCartItems(cart.Items);
  });

  readonly totals = computed(() => {
    const subtotal = this.lineItems().reduce((sum, item) => sum + item.lineTotal, 0);
    const shippingAmount = this.checkoutState.shippingAmount();
    return {
      subtotal,
      discount: 0,
      shippingAmount,
      total: subtotal + shippingAmount,
    };
  });

  readonly paymentLabelKey = computed(() => {
    const id = this.checkoutState.paymentMethod();
    return CHECKOUT_CONFIG.paymentMethods.find((m) => m.id === id)?.labelKey ?? id ?? '';
  });

  readonly shippingLabelKey = computed(() => {
    const id = this.checkoutState.shippingMethod();
    return CHECKOUT_CONFIG.shippingMethods.find((m) => m.id === id)?.labelKey ?? id ?? '';
  });

  readonly addressText = computed(() => {
    const id = this.checkoutState.selectedAddressId();
    const found = this.savedAddresses().find((a) => a.id === id);
    return found ? formatAddressLines(found).join(' · ') : '';
  });

  ngOnInit(): void {
    this.cart.refresh(this.checkoutState.couponCode() || null);
    const customerId = this.resolveCustomerId();
    if (customerId > 0) {
      this.addressApi.getAddresses(customerId).subscribe({
        next: (items) => this.savedAddresses.set(items),
      });
    }
  }

  placeOrder(): void {
    const customerId = this.resolveCustomerId();

    const validation = this.checkoutState.validateReviewStep(customerId);
    if (!validation.valid) {
      if (validation.errorKey) {
        this.toastr.warning(this.translate.instant(validation.errorKey));
      }
      this.redirectForValidationError(validation.errorKey);
      return;
    }

    if (this.lineItems().length === 0) {
      this.toastr.warning(this.translate.instant('CART.CHECKOUT_EMPTY'));
      void this.router.navigate(['/cart']);
      return;
    }

    this.placing.set(true);
    const body = this.checkoutState.toPlaceOrderRequest(customerId);
    this.checkoutApi.placeOrder(body).subscribe({
      next: (order) => {
        this.placing.set(false);
        if (!order) {
          this.toastr.error(this.translate.instant('CHECKOUT.PLACE_ORDER_FAILED'));
          return;
        }
        this.checkoutState.lastPlacedOrder.set(order);
        this.cart.clearCart().subscribe({
          next: () => {
            void this.router.navigate(['/checkout/success'], {
              state: { order },
            });
          },
          error: () => {
            void this.router.navigate(['/checkout/success'], { state: { order } });
          },
        });
      },
      error: () => {
        this.placing.set(false);
        this.toastr.error(this.translate.instant('CHECKOUT.PLACE_ORDER_FAILED'));
      },
    });
  }

  private redirectForValidationError(errorKey: string | null): void {
    if (
      errorKey === 'CHECKOUT.PAYMENT_REQUIRED' ||
      !this.checkoutState.hasPayment()
    ) {
      void this.router.navigate(['/checkout/payment']);
      return;
    }
    void this.router.navigate(['/checkout/address']);
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
