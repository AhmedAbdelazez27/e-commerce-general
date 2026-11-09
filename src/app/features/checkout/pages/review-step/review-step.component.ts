import { apiErrorMessage } from '../../../../core/utils/api-error-message.util';
import { AccountOrdersApiService } from '../../../account/services/account-orders-api.service';
import { readPendingCheckout, writePendingCheckout } from '../../utils/pending-checkout.util';
import { forkJoin } from 'rxjs';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

import { AuthTokenService } from '../../../../core/services/auth-token.service';
import { PortalConfigService } from '../../../../core/portal-config/portal-config.service';
import { CartService } from '../../../../core/services/cart.service';
import { enrichCartItems } from '../../../cart/utils/cart-enrichment.util';
import { resolveCartMerchandiseTotals } from '../../../cart/utils/cart-summary.util';
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
  private readonly portal = inject(PortalConfigService);
  private readonly ordersApi = inject(AccountOrdersApiService);
  readonly uncertain = signal(false);
  readonly placing = signal(false);
  readonly savedAddresses = signal<CustomerAddressDto[]>([]);
  readonly promotionWarnings = computed(() => this.cart.cart()?.PromotionWarnings ?? []);
  readonly blocksCheckout = computed(() =>
    (this.cart.cart()?.OfferGuidance ?? []).some((offer) => offer.blocksCheckout),
  );
  readonly canConfirm = computed(
    () =>
      !this.placing() &&
      !this.uncertain() &&
      !this.cart.reconciliationRequired() &&
      !this.cart.loading() &&
      this.lineItems().length > 0 &&
      !this.blocksCheckout(),
  );

  readonly enableShipment = this.portal.enableShipment;

  readonly lineItems = computed(() => {
    const cart = this.cart.cart();
    if (!cart?.Items?.length) {
      return [];
    }
    return enrichCartItems(cart.Items, cart.SupportsPromotionPricing === true);
  });

  readonly totals = computed(() => {
    const cart = this.cart.cart();
    const lines = this.lineItems();
    // Fall back to the coupon discount validated on the cart screen when the API
    // cart payload doesn't echo CouponDiscountAmount back.
    const appliedCoupon = this.checkoutState.couponCode().trim()
      ? this.checkoutState.couponDiscountAmount()
      : null;
    const merchandise = resolveCartMerchandiseTotals(cart, lines, cart?.Items ?? [], appliedCoupon);
    const shippingAmount = this.enableShipment() ? this.checkoutState.shippingAmount() : 0;
    return {
      subtotal: merchandise.subtotal,
      productDiscount: merchandise.productDiscount,
      couponDiscount: merchandise.couponDiscount,
      offerDiscount: merchandise.offerDiscount,
      taxAmount: merchandise.taxAmount,
      discount:
        merchandise.productDiscount + merchandise.offerDiscount + merchandise.couponDiscount,
      shippingAmount,
      total: merchandise.merchandiseTotal + shippingAmount,
    };
  });

  readonly paymentLabel = computed(() =>
    this.checkoutState.paymentLabel(this.checkoutState.paymentMethod()),
  );

  readonly shippingLabelKey = computed(() => {
    const id = this.checkoutState.shippingMethod();
    return CHECKOUT_CONFIG.shippingMethods.find((m) => m.id === id)?.labelKey ?? id ?? '';
  });

  readonly addressText = computed(() => {
    const id = this.checkoutState.selectedAddressId();
    const found = this.savedAddresses().find((a) => a.id === id);
    return found ? formatAddressLines(found).join(' · ') : '';
  });

  currencyLabel(): string {
    return this.cart.displayCurrencyCode() || this.translate.instant('PRODUCT_CARD.CURRENCY');
  }

  ngOnInit(): void {
    this.cart.refresh(this.checkoutState.couponCode() || null);
    const pending = readPendingCheckout();
    if (pending?.customerId === this.resolveCustomerId()) {
      this.uncertain.set(true);
      this.recheckOrder();
    }
    const customerId = this.resolveCustomerId();
    if (customerId > 0) {
      this.addressApi.getAddresses(customerId).subscribe({
        next: (items) => this.savedAddresses.set(items),
      });
    }
  }

  placeOrder(): void {
    if (!this.canConfirm()) return;
    if (this.blocksCheckout()) {
      this.toastr.warning(this.translate.instant('OFFERS.COMPLETE_BEFORE_CHECKOUT'));
      return;
    }
    const orderContext = this.cart.getPlaceOrderContext();

    const validation = this.checkoutState.validateReviewStep(orderContext);
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
    const body = this.checkoutState.toPlaceOrderRequest(orderContext);
    writePendingCheckout({ customerId: orderContext.customerId, cartId: orderContext.cartId });
    this.checkoutApi.placeOrder(body).subscribe({
      next: (order) => {
        this.placing.set(false);
        if (!order) {
          this.toastr.error(this.translate.instant('CHECKOUT.PLACE_ORDER_FAILED'));
          return;
        }
        this.checkoutState.lastPlacedOrder.set(order);
        writePendingCheckout(null);
        this.cart.refresh();
        void this.router.navigate(['/checkout/success'], { state: { order } });
      },
      error: (error) => {
        this.placing.set(false);
        this.cart.reconcileAfterFailure(error);
        // Transport failure or an invalid success envelope can occur after order creation.
        const status = (error as { status?: number })?.status;
        const uncertain = status === 0 || status == null || status >= 500;
        this.uncertain.set(uncertain);
        this.toastr.error(
          apiErrorMessage(
            error,
            this.translate.instant(
              uncertain ? 'CHECKOUT.UNCERTAIN' : 'CHECKOUT.PLACE_ORDER_FAILED',
            ),
          ),
        );
        if (uncertain) this.recheckOrder();
        else writePendingCheckout(null);
      },
    });
  }

  recheckOrder(): void {
    const pending = readPendingCheckout();
    if (!pending || pending.customerId !== this.resolveCustomerId() || this.placing()) return;
    this.placing.set(true);
    forkJoin({
      cart: this.cart.reloadConfirmedCart(),
      orders: this.ordersApi.getCustomerOrders(pending.customerId, true),
    }).subscribe({
      next: ({ cart, orders }) => {
        this.placing.set(false);
        const found = orders.find((order) => order.cartId === pending.cartId);
        if (found) {
          writePendingCheckout(null);
          void this.router.navigate(['/account/orders', found.id]);
          return;
        }
        // A retry is possible only after both authoritative reads succeed.
        if (cart.CartId === pending.cartId && cart.Items.length > 0) {
          writePendingCheckout(null);
          this.uncertain.set(false);
        }
      },
      error: () => {
        this.placing.set(false);
        this.uncertain.set(true);
      },
    });
  }

  private redirectForValidationError(errorKey: string | null): void {
    if (errorKey === 'CHECKOUT.CART_REQUIRED') {
      void this.router.navigate(['/cart']);
      return;
    }
    if (errorKey === 'CHECKOUT.PAYMENT_REQUIRED' || !this.checkoutState.hasPayment()) {
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
