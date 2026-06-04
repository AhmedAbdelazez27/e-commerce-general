import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import { CHECKOUT_CONFIG } from '../config/checkout.config';
import type { CustomerAddressInput } from '../models/customer-address.model';

const FIELD_MIN = {
  city: 2,
  area: 2,
  street: 2,
  building: 1,
} as const;

const FIELD_MAX = 120;

export const checkoutAddressValidators = {
  city: [Validators.required, Validators.minLength(FIELD_MIN.city), Validators.maxLength(FIELD_MAX)],
  area: [Validators.required, Validators.minLength(FIELD_MIN.area), Validators.maxLength(FIELD_MAX)],
  street: [Validators.required, Validators.minLength(FIELD_MIN.street), Validators.maxLength(FIELD_MAX)],
  building: [
    Validators.required,
    Validators.minLength(FIELD_MIN.building),
    Validators.maxLength(FIELD_MAX),
  ],
  latitude: [optionalCoordinateValidator(-90, 90)],
  longitude: [optionalCoordinateValidator(-180, 180)],
};

export function optionalCoordinateValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = String(control.value ?? '').trim();
    if (!raw) {
      return null;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < min || value > max) {
      return { coordinate: { min, max } };
    }
    return null;
  };
}

export function isAllowedPaymentMethod(method: string | null | undefined): boolean {
  if (!method?.trim()) {
    return false;
  }
  return CHECKOUT_CONFIG.paymentMethods.some((m) => m.id === method);
}

export function isAllowedShippingMethod(method: string | null | undefined): boolean {
  if (!method?.trim()) {
    return false;
  }
  return CHECKOUT_CONFIG.shippingMethods.some((m) => m.id === method);
}

export function validateNewAddressInput(address: CustomerAddressInput | null): string | null {
  if (!address) {
    return 'CHECKOUT.ADDRESS_FORM_INVALID';
  }
  if (!trimmedMin(address.city, FIELD_MIN.city)) {
    return 'CHECKOUT.VALIDATION_CITY';
  }
  if (!trimmedMin(address.area, FIELD_MIN.area)) {
    return 'CHECKOUT.VALIDATION_AREA';
  }
  if (!trimmedMin(address.street, FIELD_MIN.street)) {
    return 'CHECKOUT.VALIDATION_STREET';
  }
  if (!trimmedMin(address.building, FIELD_MIN.building)) {
    return 'CHECKOUT.VALIDATION_BUILDING';
  }
  const latErr = validateOptionalCoordinate(address.latitude, -90, 90);
  if (latErr) {
    return latErr;
  }
  const lngErr = validateOptionalCoordinate(address.longitude, -180, 180);
  if (lngErr) {
    return lngErr;
  }
  return null;
}

function validateOptionalCoordinate(
  value: number | null | undefined,
  min: number,
  max: number,
): string | null {
  if (value == null) {
    return null;
  }
  if (!Number.isFinite(value) || value < min || value > max) {
    return min === -90 ? 'CHECKOUT.VALIDATION_LATITUDE' : 'CHECKOUT.VALIDATION_LONGITUDE';
  }
  return null;
}

function trimmedMin(value: string, min: number): boolean {
  return value.trim().length >= min;
}

const FIELD_ERROR_KEYS: Record<
  'city' | 'area' | 'street' | 'building' | 'latitude' | 'longitude',
  string
> = {
  city: 'CHECKOUT.VALIDATION_CITY',
  area: 'CHECKOUT.VALIDATION_AREA',
  street: 'CHECKOUT.VALIDATION_STREET',
  building: 'CHECKOUT.VALIDATION_BUILDING',
  latitude: 'CHECKOUT.VALIDATION_LATITUDE',
  longitude: 'CHECKOUT.VALIDATION_LONGITUDE',
};

export function addressControlErrorKey(
  control: AbstractControl | null,
  field: keyof typeof FIELD_ERROR_KEYS,
  showErrors: boolean,
): string | null {
  if (!showErrors || !control?.errors) {
    return null;
  }
  if (control.errors['maxlength']) {
    return 'CHECKOUT.VALIDATION_MAX_LENGTH';
  }
  return FIELD_ERROR_KEYS[field];
}

export function markAddressFormTouched(form: {
  controls: Record<string, AbstractControl>;
}): void {
  Object.values(form.controls).forEach((c) => c.markAsTouched());
}
