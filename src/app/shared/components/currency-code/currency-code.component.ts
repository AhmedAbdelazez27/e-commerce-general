import { Component, computed, inject, input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { CurrencyService } from '../../../core/services/currency.service';

@Component({
  selector: 'app-currency-code',
  standalone: true,
  template: `{{ label() }}`,
})
export class CurrencyCodeComponent {
  readonly code = input<string | undefined>();
  private readonly currency = inject(CurrencyService);
  private readonly translate = inject(TranslateService);

  readonly label = computed(
    () =>
      this.code()?.trim() ||
      this.currency.displayCode() ||
      this.translate.instant('PRODUCT_CARD.CURRENCY'),
  );
}
