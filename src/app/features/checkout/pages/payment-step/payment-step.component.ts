import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { LanguageService } from '../../../../core/services/language.service';
import { FndLookupApiService } from '../../../../core/services/fnd-lookup-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PortalConfigService } from '../../../../core/portal-config/portal-config.service';
import { CheckoutPaymentOption } from '../../config/checkout.config';
import { CheckoutStateService } from '../../services/checkout-state.service';
import { mapPaymentLookupsToCheckoutOptions } from '../../utils/checkout-payment.mapper';
import { filterPaymentMethodsByWorkflow } from '../../utils/checkout-payment-workflow.util';

@Component({
  selector: 'app-payment-step',
  imports: [RouterLink, TranslateModule],
  templateUrl: './payment-step.component.html',
})
export class PaymentStepComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly checkoutState = inject(CheckoutStateService);
  private readonly lookupApi = inject(FndLookupApiService);
  private readonly portalConfig = inject(PortalConfigService);
  private readonly language = inject(LanguageService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly paymentOptions = signal<CheckoutPaymentOption[]>([]);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly selectedId = signal<string | null>(this.checkoutState.paymentMethod());
  readonly showPaymentError = signal(false);

  ngOnInit(): void {
    this.loadPaymentMethods();
    this.translate.onLangChange.subscribe(() => this.loadPaymentMethods());
  }

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
        this.toast.warning(this.translate.instant(result.errorKey));
      }
      return;
    }

    void this.router.navigate(['/checkout/address']);
  }

  private loadPaymentMethods(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    const lang = this.language.apiCulture();

    forkJoin({
      items: this.lookupApi.getPaymentMethods(lang),
      definitions: this.lookupApi.getPaymentMethodDefinitions(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ items, definitions }) => {
          const options = filterPaymentMethodsByWorkflow(
            mapPaymentLookupsToCheckoutOptions(items, definitions),
            {
              enableCashOnDelivery: this.portalConfig.enableCashOnDelivery(),
              enableOnlinePayment: this.portalConfig.enableOnlinePayment(),
            },
          );
          this.paymentOptions.set(options);
          this.checkoutState.setPaymentMethods(options);
          this.loadFailed.set(options.length === 0);

          const current = this.checkoutState.paymentMethod();
          if (current && options.some((option) => option.id === current)) {
            this.selectedId.set(current);
          } else if (options.length === 1) {
            this.selectPayment(options[0].id);
          }
        },
        error: () => {
          this.paymentOptions.set([]);
          this.checkoutState.setPaymentMethods([]);
          this.loadFailed.set(true);
          this.toast.error(this.translate.instant('CHECKOUT.PAYMENT_LOAD_FAILED'));
        },
      });
  }
}
