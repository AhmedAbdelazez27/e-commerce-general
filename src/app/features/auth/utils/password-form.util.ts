import { AbstractControl } from '@angular/forms';

export function passwordsMatch(control: AbstractControl): { mismatch: true } | null {
  const password = control.get('newPassword')?.value ?? control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  if (password && confirm && password !== confirm) {
    return { mismatch: true };
  }
  return null;
}

export function passwordInputType(visible: boolean): 'text' | 'password' {
  return visible ? 'text' : 'password';
}
