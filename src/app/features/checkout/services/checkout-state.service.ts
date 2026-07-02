import { Injectable, computed, signal } from '@angular/core';

import { CHECKOUT_CONFIG, CheckoutPaymentOption } from '../config/checkout.config';
import type { CustomerAddressInput } from '../models/customer-address.model';
import type { EcPlaceOrderContext, EcPlaceOrderRequest } from '../models/place-order.model';
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
  private readonly couponDiscountAmountSignal = signal<number>(0);
  private readonly notesSignal = signal<string>('');
  private readonly paymentMethodsSignal = signal<CheckoutPaymentOption[]>([]);

  readonly paymentMethod = this.paymentMethodSignal.asReadonly();
  readonly useNewAddress = this.useNewAddressSignal.asReadonly();
  readonly selectedAddressId = this.selectedAddressIdSignal.asReadonly();
  readonly newAddress = this.newAddressSignal.asReadonly();
  readonly shippingMethod = this.shippingMethodSignal.asReadonly();
  readonly shippingAmount = this.shippingAmountSignal.asReadonly();
  readonly couponCode = this.couponCodeSignal.asReadonly();
  readonly couponDiscountAmount = this.couponDiscountAmountSignal.asReadonly();
  readonly notes = this.notesSignal.asReadonly();
  readonly paymentMethods = this.paymentMethodsSignal.asReadonly();

  readonly hasPayment = computed(() =>
    isAllowedPaymentMethod(
      this.paymentMethodSignal(),
      this.paymentMethodsSignal().map((method) => method.id),
    ),
  );
  readonly hasShipping = computed(() => isAllowedShippingMethod(this.shippingMethodSignal()));
  readonly hasAddress = computed(() => {
    if (!this.hasShipping()) {
      return false;
    }
    const id = this.selectedAddressIdSignal();
    return id != null && id > 0;
  });

  readonly lastPlacedOrder = signal<import('../models/place-order.model').EcOrderDto | null>(null);

  setPaymentMethods(methods: CheckoutPaymentOption[]): void {
    this.paymentMethodsSignal.set(methods);
    const current = this.paymentMethodSignal();
    if (current && !methods.some((method) => method.id === current)) {
      this.paymentMethodSignal.set(null);
    }
  }

  setPayment(methodId: string): void {
    if (
      isAllowedPaymentMethod(
        methodId,
        this.paymentMethodsSignal().map((method) => method.id),
      )
    ) {
      this.paymentMethodSignal.set(methodId);
    }
  }

  paymentLabel(methodId: string | null): string {
    if (!methodId) {
      return '';
    }
    return this.paymentMethodsSignal().find((method) => method.id === methodId)?.label ?? methodId;
  }

  setCouponCode(code: string | null): void {
    this.couponCodeSignal.set(code?.trim() ?? '');
    if (!code?.trim()) {
      this.couponDiscountAmountSignal.set(0);
    }
  }

  setCouponDiscountAmount(amount: number | null): void {
    this.couponDiscountAmountSignal.set(amount != null && amount > 0 ? amount : 0);
  }

  setNotes(notes: string | null): void {
    this.notesSignal.set(notes?.trim() ?? '');
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

  validateReviewStep(context: EcPlaceOrderContext): CheckoutValidationResult {
    if (context.customerId < 1) {
      return { valid: false, errorKey: 'CHECKOUT.CUSTOMER_REQUIRED' };
    }
    if (context.cartId < 1) {
      return { valid: false, errorKey: 'CHECKOUT.CART_REQUIRED' };
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

  toPlaceOrderRequest(context: EcPlaceOrderContext): EcPlaceOrderRequest {
    const notes = this.notesSignal().trim();
    const couponCode = this.couponCodeSignal().trim();

    const paymentMethodLkpId = Number(this.paymentMethodSignal() ?? 0);

    return {
      cartId: context.cartId,
      customerId: context.customerId,
      sessionId: context.sessionId,
      addressId: this.selectedAddressIdSignal() ?? 0,
      newAddress: null,
      shippingMethod: this.shippingMethodSignal(),
      shippingAmount: this.shippingAmountSignal(),
      paymentMethodLkpId: Number.isFinite(paymentMethodLkpId) ? paymentMethodLkpId : 0,
      notes: notes || undefined,
      couponCode,
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
    this.couponDiscountAmountSignal.set(0);
    this.notesSignal.set('');
    this.paymentMethodsSignal.set([]);
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
