import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { stockStatus } from '../../../../shared/utils/product-stock.util';

import { AuthTokenService } from '../../../../core/services/auth-token.service';
import { CartService } from '../../../../core/services/cart.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { LanguageService } from '../../../../core/services/language.service';
import { ToastService } from '../../../../core/services/toast.service';
import type {
  OfferDefinition,
  OfferDefinitionDetail,
  OfferRewardCandidate,
} from '../../../../shared/models/promotion.model';
import {
  type OfferTextPresentation,
  hasQualifyingProducts,
  hasSeparateRewardProducts,
  isPackageOffer,
  offerDetailsForRole,
  quantityTierDetails,
  resolveOfferBenefitPresentation,
  resolveQualificationPresentation,
} from '../../../../shared/utils/offer-presentation.util';
import { CartApiService } from '../../../cart/services/cart-api.service';
import { OfferProductSectionComponent } from '../../components/offer-product-section/offer-product-section.component';
import { EcPromotionsApiService } from '../../services/ec-promotions-api.service';

@Component({
  selector: 'app-offer-detail-page',
  imports: [RouterLink, TranslateModule, OfferProductSectionComponent],
  templateUrl: './offer-detail-page.component.html',
  styleUrl: './offer-detail-page.component.scss',
})
export class OfferDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(EcPromotionsApiService);
  private readonly cartApi = inject(CartApiService);
  private readonly cart = inject(CartService);
  private readonly auth = inject(AuthTokenService);
  private readonly currency = inject(CurrencyService);
  private readonly language = inject(LanguageService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly offer = signal<OfferDefinition | null>(null);
  readonly rewardCandidates = signal<OfferRewardCandidate[]>([]);
  readonly loading = signal(false);
  readonly rewardsLoading = signal(false);
  readonly rewardsLoadFailed = signal(false);
  readonly applyingVariantId = signal<string | null>(null);
  readonly loadFailed = signal(false);
  readonly isLoggedIn = computed(() => this.auth.isLoggedIn());
  readonly cartBusy = computed(() => this.cart.loading());
  readonly benefit = computed(() => {
    const offer = this.offer();
    return offer
      ? resolveOfferBenefitPresentation(offer, this.currency.selection())
      : { key: 'OFFERS.BENEFIT.GENERIC' };
  });
  readonly qualification = computed(() => {
    const offer = this.offer();
    return offer ? resolveQualificationPresentation(offer) : null;
  });
  readonly qualifyingDetails = computed(() => {
    const offer = this.offer();
    return offer ? offerDetailsForRole(offer, 'Qualify') : [];
  });
  readonly componentDetails = computed(() => {
    const offer = this.offer();
    return offer ? offerDetailsForRole(offer, 'Component') : [];
  });
  readonly tiers = computed(() => {
    const offer = this.offer();
    return offer ? quantityTierDetails(offer) : [];
  });
  readonly showQualifyingProducts = computed(() => {
    const offer = this.offer();
    return !!offer && hasQualifyingProducts(offer);
  });
  readonly showRewardProducts = computed(() => {
    const offer = this.offer();
    return (
      !!offer &&
      (hasSeparateRewardProducts(offer) || offerDetailsForRole(offer, 'Reward').length > 0)
    );
  });
  readonly allGroups = computed(() => this.offer()?.qualificationModeCode === 'AllGroups');
  readonly currentGuidance = computed(() => {
    const offerId = this.offer()?.id;
    return offerId == null
      ? null
      : ((this.cart.cart()?.OfferGuidance ?? []).find((item) => item.offerId === offerId) ?? null);
  });
  readonly isPackageOffer = isPackageOffer;
  readonly stockStatus = stockStatus;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.loadFailed.set(true);
      return;
    }
    this.load(id);
  }

  name(): string {
    const offer = this.offer();
    return offer
      ? this.localized(offer.nameAr, offer.nameEn, this.translate.instant('OFFERS.TITLE'))
      : '';
  }

  description(): string {
    const offer = this.offer();
    if (!offer) return '';
    const value = this.localized(offer.descriptionAr, offer.descriptionEn, '');
    return this.normalizedText(value) === this.normalizedText(this.name()) ? '' : value;
  }

  benefitText(): string {
    const presentation = this.benefit();
    return this.translate.instant(presentation.key, presentation.params);
  }

  guidanceStatusText(statusCode: string): string {
    switch (statusCode) {
      case 'Applied':
      case 'EligibleNotApplied':
      case 'MissingQuantity':
      case 'MissingReward':
      case 'RewardSelectionRequired':
      case 'MissingSpend':
      case 'NoPriceBenefit':
        return this.translate.instant(`OFFERS.STATUS.${statusCode}`);
      default:
        return this.translate.instant('OFFERS.STATUS_PENDING');
    }
  }

  rewardStepNumber(): number {
    return this.showQualifyingProducts() ? 2 : 1;
  }

  qualificationText(): string {
    const presentation = this.qualification();
    return presentation ? this.translate.instant(presentation.key, presentation.params) : '';
  }

  detailName(detail: OfferDefinitionDetail): string {
    return this.localized(
      detail.targetNameAr,
      detail.targetNameEn,
      this.translate.instant('OFFERS.GENERIC_PRODUCTS'),
    );
  }

  componentDescription(detail: OfferDefinitionDetail): string {
    return detail.quantity > 0
      ? this.translate.instant('OFFERS.COMPONENT_QUANTITY', { count: detail.quantity })
      : this.translate.instant('OFFERS.COMPONENT_DESCRIPTION');
  }

  qualifyingGroupDescription(detail: OfferDefinitionDetail): string {
    return detail.quantity > 0
      ? this.translate.instant('OFFERS.ALL_GROUP_REQUIREMENT', { count: detail.quantity })
      : this.translate.instant('OFFERS.ALL_GROUP_REQUIREMENT_NEUTRAL');
  }

  qualifyingDescription(): string {
    return this.qualificationText() || this.translate.instant('OFFERS.QUALIFYING_DESCRIPTION');
  }

  rewardDescription(): string {
    const offer = this.offer();
    if (!offer) return '';
    const rewardAll = offerDetailsForRole(offer, 'Reward').some(
      (detail) => detail.targetTypeCode === 'All',
    );
    if (rewardAll) return this.translate.instant('OFFERS.REWARD_ALL_DESCRIPTION');
    if (offer.rewardSelectionCode === 'Cheapest') {
      return this.translate.instant('OFFERS.CHEAPEST_REWARD_DESCRIPTION');
    }
    return this.translate.instant('OFFERS.REWARD_DESCRIPTION');
  }

  terms(): OfferTextPresentation[] {
    const offer = this.offer();
    if (!offer) return [];
    const terms: OfferTextPresentation[] = [];
    if (offer.repeatPolicyCode === 'Once') {
      terms.push({ key: 'OFFERS.TERMS.ONCE' });
    } else if (offer.repeatPolicyCode === 'Repeat' && (offer.maxApplications ?? 0) > 0) {
      terms.push({ key: 'OFFERS.TERMS.REPEAT_LIMITED', params: { count: offer.maxApplications! } });
    } else if (offer.repeatPolicyCode === 'Repeat') {
      terms.push({ key: 'OFFERS.TERMS.REPEAT' });
    }
    if (offer.combinationPolicyCode === 'AllowCoupon') {
      terms.push({ key: 'OFFERS.TERMS.COUPON_ALLOWED' });
    } else if (offer.combinationPolicyCode === 'Exclusive') {
      terms.push({ key: 'OFFERS.TERMS.COUPON_EXCLUSIVE' });
    }
    if (this.showRewardProducts()) {
      if (offer.rewardSelectionCode === 'CustomerChoice') {
        terms.push({ key: 'OFFERS.TERMS.CUSTOMER_CHOICE' });
      } else if (offer.rewardSelectionCode === 'Cheapest') {
        terms.push({ key: 'OFFERS.TERMS.CHEAPEST' });
      }
      if (offer.unavailableRewardCode === 'Block') {
        terms.push({ key: 'OFFERS.TERMS.REWARD_REQUIRED' });
      }
    }
    return terms;
  }

  formatBusinessDate(value: string | undefined): string {
    if (!value) return '';
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return value;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return new Intl.DateTimeFormat(this.language.currentLang() === 'ar' ? 'ar-AE' : 'en-AE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  candidateName(candidate: OfferRewardCandidate): string {
    return this.localized(
      candidate.product.productNameAr,
      candidate.product.productNameEn,
      candidate.product.variantSku ?? '',
    );
  }

  candidateStateKey(candidate: OfferRewardCandidate): string {
    if (!candidate.hasSufficientStock) return 'OFFERS.REWARD_STATE.INSUFFICIENT_STOCK';
    if (candidate.offerAppliedAfterChange) return 'OFFERS.REWARD_STATE.WOULD_APPLY';
    if (candidate.offerEligibleAfterChange) return 'OFFERS.REWARD_STATE.ELIGIBLE_NOT_WINNING';
    return 'OFFERS.REWARD_STATE.REQUIREMENTS_MISSING';
  }

  applyReward(candidate: OfferRewardCandidate): void {
    const offer = this.offer();
    if (
      !offer?.rowVersion ||
      !candidate.hasSufficientStock ||
      !candidate.product.isAvailable ||
      offer.rewardSelectionCode !== 'CustomerChoice' ||
      this.cart.loading()
    )
      return;
    const existing = this.cart
      .cart()
      ?.Items.find(
        (item) =>
          item.ProductId === candidate.product.productId &&
          (item.ProductVariantId ?? null) === candidate.product.productVariantId,
      );
    const quantity = (existing?.Quantity ?? 0) + candidate.additionalQuantity;
    if (quantity <= 0) return;
    this.applyingVariantId.set(
      candidate.product.productId + ':' + candidate.product.productVariantId,
    );
    this.cart
      .applyOfferSelection({
        offerId: offer.id,
        offerRowVersion: offer.rowVersion,
        clearOtherRewards: true,
        items: [
          {
            productId: candidate.product.productId,
            productVariantId: candidate.product.productVariantId,
            quantity,
            selectedReward: candidate.markSelectedReward,
          },
        ],
      })
      .pipe(finalize(() => this.applyingVariantId.set(null)))
      .subscribe((ok) => {
        if (ok) this.toast.success(this.translate.instant('OFFERS.SELECTION_APPLIED'));
        this.load(offer.id);
      });
  }

  private load(id: number): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api
      .getOffer(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (offer) => {
          this.offer.set(offer);
          if (offer && this.auth.isLoggedIn() && offer.rewardSelectionCode === 'CustomerChoice') {
            this.loadRewards(offer.id);
          }
        },
        error: () => this.loadFailed.set(true),
      });
  }

  private loadRewards(offerId: number): void {
    const selectedCurrency = this.currency.selection();
    this.rewardsLoading.set(true);
    this.rewardsLoadFailed.set(false);
    this.cartApi
      .getOfferRewards({
        ...this.cart.getPlaceOrderContext(),
        offerId,
        currencyId: selectedCurrency.id,
        currencyCode: selectedCurrency.code,
        maxResultCount: 10,
      })
      .pipe(finalize(() => this.rewardsLoading.set(false)))
      .subscribe({
        next: (result) => this.rewardCandidates.set(result.items),
        error: () => this.rewardsLoadFailed.set(true),
      });
  }

  private localized(ar: string | undefined, en: string | undefined, fallback: string): string {
    const primary = this.language.currentLang() === 'ar' ? ar : en;
    const secondary = this.language.currentLang() === 'ar' ? en : ar;
    return primary?.trim() || secondary?.trim() || fallback;
  }

  private normalizedText(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  }
}
