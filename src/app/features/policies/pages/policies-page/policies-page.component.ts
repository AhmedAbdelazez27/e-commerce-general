import { Component, DestroyRef, computed, effect, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

import { PortalConfigService } from '../../../../core/portal-config/portal-config.service';
import {
  isPortalPolicyType,
  portalPoliciesAvailable,
  resolvePortalPolicyText,
} from '../../../../core/portal-config/portal-policy.util';
import { PortalPolicyType } from '../../../../core/portal-config/portal-configuration.model';
import { PortalSeoService } from '../../../../core/portal-seo/portal-seo.service';
import { LanguageService } from '../../../../core/services/language.service';
import { CatalogBreadcrumbComponent } from '../../../catalog/components/catalog-breadcrumb/catalog-breadcrumb.component';
import { CatalogBreadcrumbItem } from '../../../catalog/models/catalog-listing.model';

interface PolicyTab {
  id: PortalPolicyType;
  labelKey: string;
}

@Component({
  selector: 'app-policies-page',
  imports: [RouterLink, RouterLinkActive, TranslateModule, CatalogBreadcrumbComponent],
  templateUrl: './policies-page.component.html',
})
export class PoliciesPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly portal = inject(PortalConfigService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private readonly portalSeo = inject(PortalSeoService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly policyTypeParam = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('policyType'))),
    { initialValue: this.route.snapshot.paramMap.get('policyType') },
  );

  readonly availablePolicies = computed(() => portalPoliciesAvailable(this.portal.config().policies));

  readonly activePolicy = computed<PortalPolicyType>(() => {
    const requested = this.policyTypeParam();
    const available = this.availablePolicies();
    if (isPortalPolicyType(requested) && available.includes(requested)) {
      return requested;
    }
    return this.defaultPolicy();
  });

  readonly tabs = computed<PolicyTab[]>(() => {
    const allTabs: PolicyTab[] = [
      { id: 'terms', labelKey: 'POLICIES.TERMS' },
      { id: 'privacy', labelKey: 'POLICIES.PRIVACY' },
      { id: 'refund', labelKey: 'POLICIES.REFUND' },
    ];
    const available = new Set(this.availablePolicies());
    return allTabs.filter((tab) => available.has(tab.id));
  });

  readonly defaultPolicy = computed<PortalPolicyType>(
    () => this.availablePolicies()[0] ?? 'terms',
  );

  readonly pageTitleKey = computed(() => this.policyLabelKey(this.activePolicy()));

  readonly policyText = computed(() =>
    resolvePortalPolicyText(
      this.portal.config().policies,
      this.activePolicy(),
      this.language.currentLang(),
    ),
  );

  readonly breadcrumbs = computed<CatalogBreadcrumbItem[]>(() => [
    { labelKey: 'PAGE.HOME', route: '/home' },
    {
      labelKey: this.policyLabelKey(this.activePolicy()),
      current: true,
    },
  ]);

  constructor() {
    effect(() => {
      const requested = this.policyTypeParam();
      const available = this.availablePolicies();
      const fallback = this.defaultPolicy();

      if (!available.length) {
        return;
      }

      if (!isPortalPolicyType(requested) || !available.includes(requested)) {
        void this.router.navigate(['/policies', fallback], { replaceUrl: true });
      }
    });

    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updatePageTitle();
    });

    effect(() => {
      this.activePolicy();
      this.updatePageTitle();
    });
  }

  isActiveTab(policy: PortalPolicyType): boolean {
    return this.activePolicy() === policy;
  }

  private policyLabelKey(policy: PortalPolicyType): string {
    switch (policy) {
      case 'privacy':
        return 'POLICIES.PRIVACY';
      case 'refund':
        return 'POLICIES.REFUND';
      default:
        return 'POLICIES.TERMS';
    }
  }

  private updatePageTitle(): void {
    this.portalSeo.setPageTitle(this.translate.instant(this.policyLabelKey(this.activePolicy())));
  }
}
