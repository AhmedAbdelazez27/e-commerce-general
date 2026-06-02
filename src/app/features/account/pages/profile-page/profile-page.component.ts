import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { AuthApiService } from '../../../auth/services/auth-api.service';
import { resultFromAbpEnvelope } from '../../../../core/utils/api-envelope.util';
import { CustomerProfileDto } from '../../models/customer-profile.model';

@Component({
  selector: 'app-profile-page',
  imports: [TranslateModule],
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly profile = signal<CustomerProfileDto | null>(null);

  readonly groupName = computed(() => {
    const p = this.profile();
    if (!p?.customerGroup) {
      return '';
    }
    const lang = this.translate.currentLang || this.translate.getDefaultLang() || 'en';
    return lang === 'ar' ? p.customerGroup.nameAr : p.customerGroup.nameEn;
  });

  constructor() {
    this.load();
  }

  reload(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.authApi
      .getECommerceCustomerProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          const payload = resultFromAbpEnvelope<CustomerProfileDto>(res);
          this.profile.set(payload ?? null);
        },
        error: () => {
          this.profile.set(null);
        },
      });
  }
}

