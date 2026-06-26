import { AbstractControl, Validators } from '@angular/forms';

const FIELD_MIN = {
  name: 2,
  phone1: 6,
  message: 10,
} as const;

const FIELD_MAX = 500;

export const contactFormValidators = {
  name: [Validators.required, Validators.minLength(FIELD_MIN.name), Validators.maxLength(FIELD_MAX)],
  email: [Validators.required, Validators.email, Validators.maxLength(FIELD_MAX)],
  phone1: [Validators.required, Validators.minLength(FIELD_MIN.phone1), Validators.maxLength(30)],
  companyName: [Validators.maxLength(FIELD_MAX)],
  message: [
    Validators.required,
    Validators.minLength(FIELD_MIN.message),
    Validators.maxLength(2000),
  ],
};

const FIELD_ERROR_KEYS: Record<'name' | 'email' | 'phone1' | 'companyName' | 'message', string> = {
  name: 'CONTACT.VALIDATION_NAME',
  email: 'CONTACT.VALIDATION_EMAIL',
  phone1: 'CONTACT.VALIDATION_PHONE',
  companyName: 'CONTACT.VALIDATION_MAX_LENGTH',
  message: 'CONTACT.VALIDATION_MESSAGE',
};

export function contactControlErrorKey(
  control: AbstractControl | null,
  field: keyof typeof FIELD_ERROR_KEYS,
  showErrors: boolean,
): string | null {
  if (!showErrors || !control?.errors) {
    return null;
  }

  if (control.errors['email']) {
    return 'CONTACT.VALIDATION_EMAIL_FORMAT';
  }

  if (control.errors['maxlength']) {
    return 'CONTACT.VALIDATION_MAX_LENGTH';
  }

  return FIELD_ERROR_KEYS[field];
}
