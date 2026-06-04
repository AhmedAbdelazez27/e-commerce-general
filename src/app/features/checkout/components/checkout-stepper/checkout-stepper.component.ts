import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map, startWith } from 'rxjs';

import type { CheckoutStep } from '../../models/checkout-state.model';

@Component({
  selector: 'app-checkout-stepper',
  imports: [TranslateModule],
  templateUrl: './checkout-stepper.component.html',
})
export class CheckoutStepperComponent {
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly activeStep = computed((): CheckoutStep => {
    const path = this.url();
    if (path.includes('/checkout/address')) {
      return 'address';
    }
    if (path.includes('/checkout/review')) {
      return 'review';
    }
    if (path.includes('/checkout/success')) {
      return 'success';
    }
    return 'payment';
  });

  readonly steps = [
    { id: 'payment' as const, route: '/checkout/payment', labelKey: 'CHECKOUT.STEP_PAYMENT' },
    { id: 'address' as const, route: '/checkout/address', labelKey: 'CHECKOUT.STEP_ADDRESS' },
    { id: 'review' as const, route: '/checkout/review', labelKey: 'CHECKOUT.STEP_REVIEW' },
  ];

  stepIndex(step: CheckoutStep): number {
    return this.steps.findIndex((s) => s.id === step);
  }

  isComplete(step: (typeof this.steps)[number]): boolean {
    return this.stepIndex(step.id) < this.stepIndex(this.activeStep());
  }

  isActive(step: (typeof this.steps)[number]): boolean {
    return step.id === this.activeStep();
  }
}
