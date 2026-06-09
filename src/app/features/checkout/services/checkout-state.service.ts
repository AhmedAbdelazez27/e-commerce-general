import { Injectable, computed, signal } from '@angular/core';

import { CHECKOUT_CONFIG } from '../config/checkout.config';
import type { CustomerAddressInput } from '../models/customer-address.model';
import type { EcPlaceOrderRequest } from '../models/place-order.model';
import { isAllowedPaymentMethod, isAllowedShippingMethod } from '../utils/checkout-validation.util';

export interface CheckoutValidationResult {
  valid: boolean;
  errorKey: string | null;
}

@Injectable({ providedIn: 'root' })
export class CheckoutStateService {
  private readonly paymentMethodSignal = signal<string | null>(null);
  private readonly useNewAddressSignal = signal(false);
  private readonly selectedAddressIdSignal = signal<number | null>(null);
  private readonly newAddressSignal = signal<CustomerAddressInput | null>(null);
  private readonly shippingMethodSignal = signal(
    CHECKOUT_CONFIG.shippingMethods[0]?.id ?? 'Standard',
  );
  private readonly shippingAmountSignal = signal(
    CHECKOUT_CONFIG.shippingMethods[0]?.amount ?? 0,
  );
  private readonly couponCodeSignal = signal<string>('');

  readonly paymentMethod = this.paymentMethodSignal.asReadonly();
  readonly useNewAddress = this.useNewAddressSignal.asReadonly();
  readonly selectedAddressId = this.selectedAddressIdSignal.asReadonly();
  readonly newAddress = this.newAddressSignal.asReadonly();
  readonly shippingMethod = this.shippingMethodSignal.asReadonly();
  readonly shippingAmount = this.shippingAmountSignal.asReadonly();
  readonly couponCode = this.couponCodeSignal.asReadonly();

  readonly hasPayment = computed(() => isAllowedPaymentMethod(this.paymentMethodSignal()));
  readonly hasShipping = computed(() => isAllowedShippingMethod(this.shippingMethodSignal()));
  readonly hasAddress = computed(() => {
    if (!this.hasShipping()) {
      return false;
    }
    const id = this.selectedAddressIdSignal();
    return id != null && id > 0;
  });

  readonly lastPlacedOrder = signal<import('../models/place-order.model').EcOrderDto | null>(null);

  setPayment(methodId: string): void {
    if (isAllowedPaymentMethod(methodId)) {
      this.paymentMethodSignal.set(methodId);
    }
  }

  setCouponCode(code: string | null): void {
    this.couponCodeSignal.set(code?.trim() ?? '');
  }

  selectSavedAddress(addressId: number): void {
    if (addressId < 1) {
      return;
    }
    this.useNewAddressSignal.set(false);
    this.selectedAddressIdSignal.set(addressId);
    this.newAddressSignal.set(null);
  }

  selectNewAddressForm(): void {
    this.useNewAddressSignal.set(true);
    this.selectedAddressIdSignal.set(null);
    if (!this.newAddressSignal()) {
      this.newAddressSignal.set(this.emptyAddressInput());
    }
  }

  updateNewAddress(patch: Partial<CustomerAddressInput>): void {
    const current = this.newAddressSignal() ?? this.emptyAddressInput();
    this.newAddressSignal.set({ ...current, ...patch });
    this.useNewAddressSignal.set(true);
    this.selectedAddressIdSignal.set(null);
  }

  setShipping(methodId: string, amount: number): void {
    if (!isAllowedShippingMethod(methodId)) {
      return;
    }
    this.shippingMethodSignal.set(methodId);
    this.shippingAmountSignal.set(Math.max(0, amount));
  }

  validatePaymentStep(): CheckoutValidationResult {
    if (!this.hasPayment()) {
      return { valid: false, errorKey: 'CHECKOUT.PAYMENT_REQUIRED' };
    }
    return { valid: true, errorKey: null };
  }

  validateAddressStep(): CheckoutValidationResult {
    if (!this.hasPayment()) {
      return { valid: false, errorKey: 'CHECKOUT.PAYMENT_REQUIRED' };
    }
    if (!this.hasShipping()) {
      return { valid: false, errorKey: 'CHECKOUT.SHIPPING_REQUIRED' };
    }
    const id = this.selectedAddressIdSignal();
    if (id == null || id < 1) {
      return { valid: false, errorKey: 'CHECKOUT.ADDRESS_REQUIRED' };
    }
    return { valid: true, errorKey: null };
  }

  validateReviewStep(customerId: number): CheckoutValidationResult {
    if (customerId < 1) {
      return { valid: false, errorKey: 'CHECKOUT.CUSTOMER_REQUIRED' };
    }
    const payment = this.validatePaymentStep();
    if (!payment.valid) {
      return payment;
    }
    const address = this.validateAddressStep();
    if (!address.valid) {
      return address;
    }
    return { valid: true, errorKey: null };
  }

  toPlaceOrderRequest(customerId: number): EcPlaceOrderRequest {
    return {
      customerId,
      sessionId: '',
      addressId: this.selectedAddressIdSignal() ?? 0,
      newAddress: null,
      shippingMethod: this.shippingMethodSignal(),
      shippingAmount: this.shippingAmountSignal(),
      paymentMethod: this.paymentMethodSignal() ?? '',
      couponCode: this.couponCodeSignal(),
    };
  }

  reset(): void {
    this.paymentMethodSignal.set(null);
    this.useNewAddressSignal.set(false);
    this.selectedAddressIdSignal.set(null);
    this.newAddressSignal.set(null);
    this.shippingMethodSignal.set(CHECKOUT_CONFIG.shippingMethods[0]?.id ?? 'Standard');
    this.shippingAmountSignal.set(CHECKOUT_CONFIG.shippingMethods[0]?.amount ?? 0);
    this.couponCodeSignal.set('');
    this.lastPlacedOrder.set(null);
  }

  private emptyAddressInput(): CustomerAddressInput {
    return {
      customerId: 0,
      countryId: CHECKOUT_CONFIG.defaultCountryId,
      city: '',
      area: '',
      street: '',
      building: '',
      latitude: null,
      longitude: null,
      isDefault: false,
    };
  }
}
