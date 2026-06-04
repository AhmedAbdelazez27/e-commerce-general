import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

import { CHECKOUT_CONFIG } from '../../config/checkout.config';
import { CheckoutStateService } from '../../services/checkout-state.service';

@Component({
  selector: 'app-payment-step',
  imports: [RouterLink, TranslateModule],
  templateUrl: './payment-step.component.html',
})
export class PaymentStepComponent {
  private readonly router = inject(Router);
  private readonly checkoutState = inject(CheckoutStateService);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);

  readonly paymentOptions = CHECKOUT_CONFIG.paymentMethods;
  readonly selectedId = signal<string | null>(this.checkoutState.paymentMethod());
  readonly showPaymentError = signal(false);

  selectPayment(id: string): void {
    this.selectedId.set(id);
    this.checkoutState.setPayment(id);
    this.showPaymentError.set(false);
  }

  continue(): void {
    const id = this.selectedId();
    if (id) {
      this.checkoutState.setPayment(id);
    }

    const result = this.checkoutState.validatePaymentStep();
    if (!result.valid) {
      this.showPaymentError.set(true);
      if (result.errorKey) {
        this.toastr.warning(this.translate.instant(result.errorKey));
      }
      return;
    }

    void this.router.navigate(['/checkout/address']);
  }
}
