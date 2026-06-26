import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { PortalConfigService } from '../../../../core/portal-config/portal-config.service';
import { resolvePortalAddress } from '../../../../core/portal-config/portal-contact.util';
import { LanguageService } from '../../../../core/services/language.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { ToastService } from '../../../../core/services/toast.service';
import { abpErrorMessage } from '../../../auth/utils/auth-abp.util';
import { CatalogBreadcrumbComponent } from '../../../catalog/components/catalog-breadcrumb/catalog-breadcrumb.component';
import { CatalogBreadcrumbItem } from '../../../catalog/models/catalog-listing.model';
import type { ContactFormValue } from '../../models/contact-form.model';
import { ContactApiService } from '../../services/contact-api.service';
import {
  contactControlErrorKey,
  contactFormValidators,
} from '../../utils/contact-validation.util';

@Component({
  selector: 'app-contact-page',
  imports: [ReactiveFormsModule, TranslateModule, CatalogBreadcrumbComponent],
  templateUrl: './contact-page.component.html',
})
export class ContactPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly contactApi = inject(ContactApiService);
  private readonly tenants = inject(TenantService);
  private readonly portal = inject(PortalConfigService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly showFormErrors = signal(false);

  readonly contactInfo = () => this.portal.config().contactInfo;
  readonly hasContactInfo = this.portal.hasContactInfo;
  readonly contactAddress = computed(() =>
    resolvePortalAddress(this.portal.config(), this.language.currentLang()),
  );

  readonly breadcrumbs: CatalogBreadcrumbItem[] = [
    { labelKey: 'PAGE.HOME', route: '/home' },
    { labelKey: 'PAGE.CONTACT', current: true },
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', contactFormValidators.name],
    email: ['', contactFormValidators.email],
    phone1: ['', contactFormValidators.phone1],
    companyName: ['', contactFormValidators.companyName],
    message: ['', contactFormValidators.message],
  });

  fieldError(field: 'name' | 'email' | 'phone1' | 'companyName' | 'message'): string | null {
    return contactControlErrorKey(this.form.get(field), field, this.showFormErrors());
  }

  submit(): void {
    this.showFormErrors.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const tenancyName = this.tenants.tenancyName();
    const tenantId = this.tenants.tenantId();
    if (!tenancyName || tenantId == null) {
      this.toast.error(this.translate.instant('CONTACT.TENANT_UNAVAILABLE'));
      return;
    }

    const value = this.form.getRawValue() as ContactFormValue;
    this.loading.set(true);

    this.contactApi
      .createByTenancyName({
        name: value.name.trim(),
        email: value.email.trim(),
        phone1: value.phone1.trim(),
        companyName: value.companyName.trim(),
        message: value.message.trim(),
        tenancyName,
        tenantId,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.submitted.set(true);
          this.showFormErrors.set(false);
          this.form.reset();
          this.toast.success(this.translate.instant('CONTACT.SUBMIT_SUCCESS'));
        },
        error: (err) => {
          this.toast.error(
            abpErrorMessage(err, this.translate.instant('CONTACT.SUBMIT_FAILED')),
          );
        },
      });
  }

  resetForm(): void {
    this.submitted.set(false);
    this.showFormErrors.set(false);
    this.form.reset();
  }
}
