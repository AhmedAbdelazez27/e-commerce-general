import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

import { AuthTokenService } from '../../../../core/services/auth-token.service';
import { PortalConfigService } from '../../../../core/portal-config/portal-config.service';
import { abpErrorMessage, abpRequestSucceeded } from '../../../auth/utils/auth-abp.util';
import { passwordsMatch, passwordInputType } from '../../../auth/utils/password-form.util';
import { CHECKOUT_CONFIG } from '../../../checkout/config/checkout.config';
import type { CustomerAddressDto } from '../../../checkout/models/customer-address.model';
import { CustomerAddressApiService } from '../../../checkout/services/customer-address-api.service';
import {
  addressControlErrorKey,
  checkoutAddressValidators,
  markAddressFormTouched,
} from '../../../checkout/utils/checkout-validation.util';
import { ACCOUNT_CONFIG, resolveGenderLabelKey, resolveGenderLkpId } from '../../config/account.config';
import { CustomerProfileDto } from '../../models/customer-profile.model';
import { AccountApiService } from '../../services/account-api.service';

type AddressUiMode = 'list' | 'add' | 'edit';
type ProfileUiMode = 'view' | 'edit';
type PasswordVisibilityField = 'current' | 'new' | 'confirm';

const PROFILE_GENDER_OPTIONS = ACCOUNT_CONFIG.genderOptions;

@Component({
  selector: 'app-profile-page',
  imports: [RouterLink, TranslateModule, ReactiveFormsModule],
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent {
  private readonly accountApi = inject(AccountApiService);
  private readonly addressApi = inject(CustomerAddressApiService);
  private readonly auth = inject(AuthTokenService);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly portal = inject(PortalConfigService);

  readonly enableReturns = this.portal.enableReturns;

  readonly completeProfileMode = signal(
    this.route.snapshot.queryParamMap.get('completeProfile') === '1',
  );

  readonly loading = signal(true);
  readonly profile = signal<CustomerProfileDto | null>(null);
  readonly profileUiMode = signal<ProfileUiMode>('view');
  readonly profileSaving = signal(false);
  readonly showProfileFormErrors = signal(false);
  readonly passwordSaving = signal(false);
  readonly showPasswordFormErrors = signal(false);
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly genderOptions = PROFILE_GENDER_OPTIONS;

  readonly addresses = signal<CustomerAddressDto[]>([]);
  readonly addressesLoading = signal(false);
  readonly addressSaving = signal(false);
  readonly addressUiMode = signal<AddressUiMode>('list');
  readonly editingAddressId = signal<number | null>(null);
  readonly showFormErrors = signal(false);

  readonly profileForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', Validators.required],
    birthDate: [''],
    genderLkpId: [0],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  readonly addressForm = this.fb.nonNullable.group({
    city: ['', checkoutAddressValidators.city],
    area: ['', checkoutAddressValidators.area],
    street: ['', checkoutAddressValidators.street],
    building: ['', checkoutAddressValidators.building],
    isDefault: [false],
  });

  readonly groupName = computed(() => {
    const p = this.profile();
    if (!p?.customerGroup) {
      return '';
    }
    const lang = this.translate.currentLang || this.translate.getDefaultLang() || 'en';
    return lang === 'ar' ? p.customerGroup.nameAr : p.customerGroup.nameEn;
  });

  readonly formattedBirthDate = computed(() => {
    const raw = this.profile()?.birthDate;
    if (!raw) {
      return '';
    }
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? raw : date.toLocaleDateString();
  });

  readonly genderLabelKey = computed(() => {
    const p = this.profile();
    return p ? resolveGenderLabelKey(p) : null;
  });

  constructor() {
    this.load();
  }

  reload(): void {
    this.cancelAddressForm();
    this.cancelProfileEdit();
    this.resetPasswordForm();
    this.load();
  }

  startProfileEdit(): void {
    const p = this.profile();
    if (!p) {
      return;
    }

    this.profileUiMode.set('edit');
    this.showProfileFormErrors.set(false);
    this.profileForm.patchValue({
      fullName: p.fullName,
      email: p.email,
      mobile: p.mobile,
      birthDate: this.toDateInputValue(p.birthDate),
      genderLkpId: resolveGenderLkpId(p),
    });
  }

  cancelProfileEdit(): void {
    this.profileUiMode.set('view');
    this.showProfileFormErrors.set(false);
    this.profileForm.reset({ genderLkpId: 0 });
  }

  resetPasswordForm(): void {
    this.showPasswordFormErrors.set(false);
    this.resetPasswordVisibility();
    this.passwordForm.reset();
  }

  togglePasswordVisibility(field: PasswordVisibilityField): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword.update((visible) => !visible);
        break;
      case 'new':
        this.showNewPassword.update((visible) => !visible);
        break;
      case 'confirm':
        this.showConfirmPassword.update((visible) => !visible);
        break;
    }
  }

  readonly passwordInputType = passwordInputType;

  passwordToggleLabel(visible: boolean): string {
    return this.translate.instant(visible ? 'COMMON.HIDE_PASSWORD' : 'COMMON.SHOW_PASSWORD');
  }

  saveProfile(): void {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) {
      this.showProfileFormErrors.set(true);
      this.toastr.warning(this.translate.instant('PROFILE.UPDATE_FORM_INVALID'));
      return;
    }

    const p = this.profile();
    const customerId = this.resolveCustomerId();
    const userId = this.resolveUserId();
    if (!p || customerId <= 0 || userId <= 0) {
      this.toastr.error(this.translate.instant('PROFILE.LOAD_FAILED'));
      return;
    }

    const raw = this.profileForm.getRawValue();
    this.profileSaving.set(true);
    this.accountApi
      .updateProfile({
        customerId,
        userId,
        fullName: raw.fullName.trim(),
        email: raw.email.trim(),
        mobile: raw.mobile.trim(),
        birthDate: raw.birthDate ? new Date(`${raw.birthDate}T00:00:00`).toISOString() : null,
        genderLkpId: Number(raw.genderLkpId) > 0 ? Number(raw.genderLkpId) : 0,
      })
      .pipe(finalize(() => this.profileSaving.set(false)))
      .subscribe({
        next: (updated) => {
          if (updated) {
            this.profile.set(updated);
          }
          if (this.completeProfileMode()) {
            this.completeProfileMode.set(false);
            this.toastr.success(this.translate.instant('PROFILE.COMPLETE_PROFILE_SUCCESS'));
            void this.router.navigateByUrl('/home');
            return;
          }
          this.toastr.success(this.translate.instant('PROFILE.UPDATED'));
          this.cancelProfileEdit();
        },
        error: () => {
          this.toastr.error(this.translate.instant('PROFILE.UPDATE_FAILED'));
        },
      });
  }

  profileFieldError(field: 'fullName' | 'email' | 'mobile'): string | null {
    const control = this.profileForm.get(field);
    if (!this.showProfileFormErrors() || !control?.errors) {
      return null;
    }
    if (control.errors['email']) {
      return 'AUTH.EMAIL_REQUIRED';
    }
    return 'PROFILE.UPDATE_FORM_INVALID';
  }

  passwordFieldError(field: 'currentPassword' | 'newPassword' | 'confirmPassword'): string | null {
    const control = this.passwordForm.get(field);
    if (!this.showPasswordFormErrors()) {
      return null;
    }
    if (field === 'confirmPassword' && this.passwordForm.errors?.['mismatch']) {
      return 'AUTH.PASSWORD_MISMATCH';
    }
    if (!control?.errors) {
      return null;
    }
    if (field === 'currentPassword' && control.errors['required']) {
      return 'PROFILE.CURRENT_PASSWORD_REQUIRED';
    }
    if (field === 'newPassword' && (control.errors['required'] || control.errors['minlength'])) {
      return 'AUTH.PASSWORD_MIN';
    }
    if (field === 'confirmPassword' && control.errors['required']) {
      return 'AUTH.PASSWORD_MISMATCH';
    }
    return null;
  }

  changePassword(): void {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) {
      this.showPasswordFormErrors.set(true);
      this.toastr.warning(this.translate.instant('PROFILE.CHANGE_PASSWORD_FAILED'));
      return;
    }

    const raw = this.passwordForm.getRawValue();
    this.passwordSaving.set(true);
    this.accountApi
      .changePassword({
        currentPassword: raw.currentPassword,
        newPassword: raw.newPassword,
      })
      .pipe(finalize(() => this.passwordSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (!abpRequestSucceeded(res)) {
            this.toastr.error(this.translate.instant('PROFILE.CHANGE_PASSWORD_FAILED'));
            return;
          }
          this.toastr.success(this.translate.instant('PROFILE.CHANGE_PASSWORD_SUCCESS'));
          this.resetPasswordForm();
        },
        error: (err) => {
          this.toastr.error(
            abpErrorMessage(err, this.translate.instant('PROFILE.CHANGE_PASSWORD_FAILED')),
          );
        },
      });
  }

  fieldError(field: 'city' | 'area' | 'street' | 'building'): string | null {
    return addressControlErrorKey(this.addressForm.get(field), field, this.showFormErrors());
  }

  startAdd(): void {
    this.addressUiMode.set('add');
    this.editingAddressId.set(null);
    this.showFormErrors.set(false);
    this.addressForm.reset({ isDefault: false });
  }

  startEdit(addr: CustomerAddressDto): void {
    this.addressUiMode.set('edit');
    this.editingAddressId.set(addr.id);
    this.showFormErrors.set(false);
    this.addressForm.patchValue({
      city: addr.city,
      area: addr.area,
      street: addr.street,
      building: addr.building,
      isDefault: addr.isDefault,
    });
  }

  cancelAddressForm(): void {
    this.addressUiMode.set('list');
    this.editingAddressId.set(null);
    this.showFormErrors.set(false);
    this.addressForm.reset({ isDefault: false });
  }

  saveAddress(): void {
    markAddressFormTouched(this.addressForm);
    if (this.addressForm.invalid) {
      this.showFormErrors.set(true);
      this.toastr.warning(this.translate.instant('CHECKOUT.ADDRESS_FORM_INVALID'));
      return;
    }

    const customerId = this.resolveCustomerId();
    if (customerId <= 0) {
      this.toastr.error(this.translate.instant('PROFILE.LOAD_FAILED'));
      return;
    }

    const raw = this.addressForm.getRawValue();
    const body = {
      customerId,
      countryId: CHECKOUT_CONFIG.defaultCountryId,
      city: raw.city.trim(),
      area: raw.area.trim(),
      street: raw.street.trim(),
      building: raw.building.trim(),
      isDefault: raw.isDefault,
    };

    const editingId = this.editingAddressId();
    const request$ =
      this.addressUiMode() === 'edit' && editingId != null
        ? this.addressApi.updateAddress({ ...body, id: editingId })
        : this.addressApi.createAddress(body);

    this.addressSaving.set(true);
    request$.pipe(finalize(() => this.addressSaving.set(false))).subscribe({
      next: () => {
        this.toastr.success(
          this.translate.instant(
            editingId != null ? 'PROFILE.ADDRESS_UPDATED' : 'PROFILE.ADDRESS_CREATED',
          ),
        );
        this.cancelAddressForm();
        this.loadAddresses();
      },
      error: () => {
        this.toastr.error(this.translate.instant('PROFILE.ADDRESS_SAVE_FAILED'));
      },
    });
  }

  deleteAddress(id: number): void {
    this.addressApi.deleteAddress(id).subscribe({
      next: () => {
        this.toastr.success(this.translate.instant('PROFILE.ADDRESS_DELETED'));
        if (this.editingAddressId() === id) {
          this.cancelAddressForm();
        }
        this.loadAddresses();
      },
      error: () => {
        this.toastr.error(this.translate.instant('PROFILE.ADDRESS_DELETE_FAILED'));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.accountApi
      .getMyProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (payload) => {
          this.profile.set(payload);
          if (payload?.id) {
            this.loadAddresses();
          }
          if (this.completeProfileMode() && payload && !payload.mobile?.trim()) {
            this.startProfileEdit();
          }
        },
        error: () => {
          this.profile.set(null);
        },
      });
  }

  private loadAddresses(): void {
    const customerId = this.resolveCustomerId();
    if (customerId <= 0) {
      this.addresses.set([]);
      return;
    }

    this.addressesLoading.set(true);
    this.addressApi
      .getAddresses(customerId)
      .pipe(finalize(() => this.addressesLoading.set(false)))
      .subscribe({
        next: (items) => this.addresses.set(items),
        error: () => this.addresses.set([]),
      });
  }

  private toDateInputValue(raw: string | null | undefined): string {
    if (!raw) {
      return '';
    }
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().slice(0, 10);
  }

  private resolveUserId(): number {
    const abpUserId = this.profile()?.abpUserId;
    if (abpUserId != null && abpUserId > 0) {
      return abpUserId;
    }

    const raw = this.auth.getUserId();
    if (!raw?.trim()) {
      return 0;
    }
    const id = Number(raw);
    return Number.isFinite(id) ? id : 0;
  }

  private resetPasswordVisibility(): void {
    this.showCurrentPassword.set(false);
    this.showNewPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  private resolveCustomerId(): number {
    const profileId = this.profile()?.id;
    if (profileId != null && profileId > 0) {
      return profileId;
    }

    const raw = this.auth.getCustomerId();
    if (!raw?.trim()) {
      return 0;
    }
    const id = Number(raw);
    return Number.isFinite(id) ? id : 0;
  }
}
