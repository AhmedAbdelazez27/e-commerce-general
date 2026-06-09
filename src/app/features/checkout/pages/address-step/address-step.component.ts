import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

import { AuthTokenService } from '../../../../core/services/auth-token.service';
import { CHECKOUT_CONFIG } from '../../config/checkout.config';
import type { CustomerAddressDto } from '../../models/customer-address.model';
import { CheckoutStateService } from '../../services/checkout-state.service';
import { CustomerAddressApiService } from '../../services/customer-address-api.service';
import { formatAddressLines } from '../../utils/checkout-api.mapper';
import {
  addressControlErrorKey,
  checkoutAddressValidators,
  markAddressFormTouched,
} from '../../utils/checkout-validation.util';

@Component({
  selector: 'app-address-step',
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './address-step.component.html',
})
export class AddressStepComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthTokenService);
  private readonly checkoutState = inject(CheckoutStateService);
  private readonly addressApi = inject(CustomerAddressApiService);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);

  readonly shippingOptions = CHECKOUT_CONFIG.shippingMethods;
  readonly addresses = signal<CustomerAddressDto[]>([]);
  readonly loading = signal(true);
  readonly mode = signal<'saved' | 'new'>(
    this.checkoutState.useNewAddress() ? 'new' : 'saved',
  );
  readonly selectedAddressId = signal<number | null>(this.checkoutState.selectedAddressId());
  readonly selectedShippingId = signal(this.checkoutState.shippingMethod());
  readonly showAddressError = signal(false);
  readonly showShippingError = signal(false);
  readonly showFormErrors = signal(false);
  readonly savingAddress = signal(false);

  readonly addressForm = this.fb.nonNullable.group({
    city: ['', checkoutAddressValidators.city],
    area: ['', checkoutAddressValidators.area],
    street: ['', checkoutAddressValidators.street],
    building: ['', checkoutAddressValidators.building],
    latitude: ['', checkoutAddressValidators.latitude],
    longitude: ['', checkoutAddressValidators.longitude],
    isDefault: [false],
  });

  ngOnInit(): void {
    const shipping = CHECKOUT_CONFIG.shippingMethods.find(
      (m) => m.id === this.checkoutState.shippingMethod(),
    );
    if (shipping) {
      this.checkoutState.setShipping(shipping.id, shipping.amount);
      this.selectedShippingId.set(shipping.id);
    }

    const customerId = this.resolveCustomerId();
    if (customerId <= 0) {
      this.loading.set(false);
      this.mode.set('new');
      this.checkoutState.selectNewAddressForm();
      this.patchFormFromState();
      this.bindFormToState();
      return;
    }

    this.addressApi.getAddresses(customerId).subscribe({
      next: (items) => {
        this.addresses.set(items);
        this.loading.set(false);
        const defaultAddr = items.find((a) => a.isDefault) ?? items[0];
        if (!this.checkoutState.useNewAddress() && defaultAddr && !this.selectedAddressId()) {
          this.selectSaved(defaultAddr.id);
        }
        if (items.length === 0) {
          this.mode.set('new');
          this.checkoutState.selectNewAddressForm();
          this.patchFormFromState();
        }
      },
      error: () => {
        this.loading.set(false);
        this.mode.set('new');
        this.checkoutState.selectNewAddressForm();
      },
    });

    this.patchFormFromState();
    this.bindFormToState();
  }

  fieldError(field: 'city' | 'area' | 'street' | 'building' | 'latitude' | 'longitude'): string | null {
    return addressControlErrorKey(this.addressForm.get(field), field, this.showFormErrors());
  }

  formatAddress(addr: CustomerAddressDto): string {
    return formatAddressLines(addr).join(' · ');
  }

  setMode(saved: boolean): void {
    this.showAddressError.set(false);
    if (saved) {
      this.mode.set('saved');
      const id = this.selectedAddressId() ?? this.addresses()[0]?.id ?? null;
      if (id) {
        this.selectSaved(id);
      }
      return;
    }
    this.mode.set('new');
    this.checkoutState.selectNewAddressForm();
    this.patchFormFromState();
  }

  selectSaved(id: number): void {
    this.selectedAddressId.set(id);
    this.checkoutState.selectSavedAddress(id);
    this.showAddressError.set(false);
  }

  selectShipping(id: string): void {
    this.selectedShippingId.set(id);
    const option = CHECKOUT_CONFIG.shippingMethods.find((m) => m.id === id);
    if (option) {
      this.checkoutState.setShipping(option.id, option.amount);
    }
    this.showShippingError.set(false);
  }

  continue(): void {
    this.showAddressError.set(false);
    this.showShippingError.set(false);
    this.showFormErrors.set(false);

    if (this.mode() === 'saved') {
      if (!this.selectedAddressId()) {
        this.showAddressError.set(true);
        this.toastr.warning(this.translate.instant('CHECKOUT.ADDRESS_REQUIRED'));
        return;
      }
      this.checkoutState.selectSavedAddress(this.selectedAddressId()!);
      this.finishAddressStep();
      return;
    }

    markAddressFormTouched(this.addressForm);
    if (this.addressForm.invalid) {
      this.showFormErrors.set(true);
      this.toastr.warning(this.translate.instant('CHECKOUT.ADDRESS_FORM_INVALID'));
      return;
    }

    const customerId = this.resolveCustomerId();
    if (customerId <= 0) {
      this.toastr.error(this.translate.instant('CHECKOUT.CUSTOMER_REQUIRED'));
      return;
    }

    const raw = this.addressForm.getRawValue();
    this.savingAddress.set(true);
    this.addressApi
      .createAddress({
        customerId,
        countryId: CHECKOUT_CONFIG.defaultCountryId,
        city: raw.city.trim(),
        area: raw.area.trim(),
        street: raw.street.trim(),
        building: raw.building.trim(),
        latitude: this.parseOptionalCoordinate(raw.latitude),
        longitude: this.parseOptionalCoordinate(raw.longitude),
        isDefault: raw.isDefault,
      })
      .pipe(finalize(() => this.savingAddress.set(false)))
      .subscribe({
        next: (created) => {
          if (!created?.id) {
            this.toastr.error(this.translate.instant('PROFILE.ADDRESS_SAVE_FAILED'));
            return;
          }
          this.addresses.update((items) => [...items, created]);
          this.mode.set('saved');
          this.selectSaved(created.id);
          this.toastr.success(this.translate.instant('PROFILE.ADDRESS_CREATED'));
          this.finishAddressStep();
        },
        error: () => {
          this.toastr.error(this.translate.instant('PROFILE.ADDRESS_SAVE_FAILED'));
        },
      });
  }

  private finishAddressStep(): void {
    const result = this.checkoutState.validateAddressStep();
    if (!result.valid) {
      if (result.errorKey === 'CHECKOUT.ADDRESS_REQUIRED') {
        this.showAddressError.set(true);
      }
      if (result.errorKey === 'CHECKOUT.SHIPPING_REQUIRED') {
        this.showShippingError.set(true);
      }
      if (result.errorKey) {
        this.toastr.warning(this.translate.instant(result.errorKey));
      }
      return;
    }

    void this.router.navigate(['/checkout/review']);
  }

  private syncFormToState(): void {
    const raw = this.addressForm.getRawValue();
    this.checkoutState.updateNewAddress({
      customerId: this.resolveCustomerId(),
      countryId: CHECKOUT_CONFIG.defaultCountryId,
      city: raw.city.trim(),
      area: raw.area.trim(),
      street: raw.street.trim(),
      building: raw.building.trim(),
      latitude: this.parseOptionalCoordinate(raw.latitude),
      longitude: this.parseOptionalCoordinate(raw.longitude),
      isDefault: raw.isDefault,
    });
  }

  private bindFormToState(): void {
    this.addressForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.mode() !== 'new') {
        return;
      }
      this.syncFormToState();
      if (this.showFormErrors() && this.addressForm.valid) {
        this.showFormErrors.set(false);
      }
    });
  }

  private patchFormFromState(): void {
    const addr = this.checkoutState.newAddress();
    if (!addr) {
      return;
    }
    this.addressForm.patchValue({
      city: addr.city,
      area: addr.area,
      street: addr.street,
      building: addr.building,
      latitude: addr.latitude != null ? String(addr.latitude) : '',
      longitude: addr.longitude != null ? String(addr.longitude) : '',
      isDefault: addr.isDefault,
    });
  }

  private parseOptionalCoordinate(raw: string): number | null {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }
    const value = Number(trimmed);
    return Number.isFinite(value) ? value : null;
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
