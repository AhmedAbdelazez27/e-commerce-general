import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import { CartService } from '../../../../core/services/cart.service';
import { CheckoutApiService } from '../../services/checkout-api.service';

@Component({
  selector: 'app-checkout-page',
  imports: [FormsModule, TranslateModule],
  templateUrl: './checkout-page.component.html',
})
export class CheckoutPageComponent {
  private readonly checkoutApi = inject(CheckoutApiService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);

  protected shippingAddress = '';
  protected notes = '';
  protected submitting = false;

  protected placeOrder(): void {
    const address = this.shippingAddress.trim();
    if (!address || this.submitting) {
      return;
    }

    this.submitting = true;
    this.checkoutApi
      .placeOrder({ ShippingAddress: address, Notes: this.notes.trim() || undefined })
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (result) => {
          if (!result) {
            this.toastr.error(this.translate.instant('CHECKOUT.FAILED'));
            return;
          }
          this.cartService.clearGuestCart();
          this.cartService.refresh();
          this.toastr.success(this.translate.instant('CHECKOUT.SUCCESS'));
          void this.router.navigate(['/account/orders']);
        },
        error: () => this.toastr.error(this.translate.instant('CHECKOUT.FAILED')),
      });
  }
}
