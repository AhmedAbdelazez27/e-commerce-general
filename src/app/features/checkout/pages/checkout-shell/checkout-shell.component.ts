import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { CheckoutStepperComponent } from '../../components/checkout-stepper/checkout-stepper.component';

@Component({
  selector: 'app-checkout-shell',
  imports: [RouterOutlet, TranslateModule, CheckoutStepperComponent],
  templateUrl: './checkout-shell.component.html',
})
export class CheckoutShellComponent {}
