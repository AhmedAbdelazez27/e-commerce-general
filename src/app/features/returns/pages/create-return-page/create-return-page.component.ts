import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { AuthTokenService } from '../../../../core/services/auth-token.service';
import { ToastService } from '../../../../core/services/toast.service';
import { formatProductPrice } from '../../../../shared/utils/product-card.util';
import { CurrencyCodeComponent } from '../../../../shared/components/currency-code/currency-code.component';
import { AccountOrdersApiService } from '../../../account/services/account-orders-api.service';
import {
  lineItemName,
  lineItemTotal,
} from '../../../account/utils/account-order.util';
import type { EcOrderDto, EcOrderDetailDto } from '../../../checkout/models/place-order.model';
import { RETURN_REASON_OPTIONS } from '../../config/return-reason.config';
import type { EcReturnDto } from '../../models/return.model';
import { ReturnsApiService } from '../../services/returns-api.service';
import {
  canRequestReturnForOrder,
  hasActiveReturnForOrderDetail,
} from '../../utils/return.util';

type WizardStep = 'order' | 'item' | 'reason' | 'details' | 'review' | 'success';

@Component({
  selector: 'app-create-return-page',
  imports: [ReactiveFormsModule, RouterLink, TranslateModule, CurrencyCodeComponent],
  templateUrl: './create-return-page.component.html',
})
export class CreateReturnPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordersApi = inject(AccountOrdersApiService);
  private readonly returnsApi = inject(ReturnsApiService);
  private readonly auth = inject(AuthTokenService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly reasonOptions = RETURN_REASON_OPTIONS;
  readonly loading = signal(true);
  readonly itemLoading = signal(false);
  readonly submitting = signal(false);
  readonly step = signal<WizardStep>('order');
  readonly orders = signal<EcOrderDto[]>([]);
  readonly existingReturns = signal<EcReturnDto[]>([]);
  readonly selectedOrder = signal<EcOrderDto | null>(null);
  readonly selectedItem = signal<EcOrderDetailDto | null>(null);
  readonly createdReturn = signal<EcReturnDto | null>(null);
  readonly showFormErrors = signal(false);

  readonly eligibleOrders = computed(() => this.orders().filter(canRequestReturnForOrder));

  readonly form = this.fb.nonNullable.group({
    reasonId: ['', Validators.required],
    otherReason: [''],
    requestedRefundAmount: [0, [Validators.required, Validators.min(0.01)]],
    notes: [''],
  });

  readonly isArabic = computed(() => (this.translate.currentLang ?? '').toLowerCase().startsWith('ar'));

  readonly stepNumber = computed(() => {
    const map: Record<WizardStep, number> = {
      order: 1,
      item: 2,
      reason: 3,
      details: 4,
      review: 5,
      success: 5,
    };
    return map[this.step()];
  });

  readonly totalSteps = 5;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const orderId = Number(params.get('orderId'));
      const orderDetailId = Number(params.get('orderDetailId'));
      this.bootstrap(
        Number.isFinite(orderId) && orderId > 0 ? orderId : null,
        Number.isFinite(orderDetailId) && orderDetailId > 0 ? orderDetailId : null,
      );
    });
  }

  formatPrice(value: number | undefined): string {
    return formatProductPrice(value ?? 0);
  }

  lineName(item: EcOrderDetailDto): string {
    return lineItemName(item);
  }

  lineTotal(item: EcOrderDetailDto): number {
    return lineItemTotal(item);
  }

  canReturnItem(item: EcOrderDetailDto): boolean {
    return !hasActiveReturnForOrderDetail(this.existingReturns(), item.id);
  }

  selectOrder(order: EcOrderDto): void {
    this.loadSelectedOrderDetails(order);
  }

  selectItem(item: EcOrderDetailDto): void {
    if (!this.canReturnItem(item)) {
      return;
    }
    this.selectedItem.set(item);
    this.form.patchValue({ requestedRefundAmount: this.lineTotal(item) });
    this.step.set('reason');
  }

  goToDetails(): void {
    if (!this.validateReason()) {
      this.showFormErrors.set(true);
      return;
    }
    this.showFormErrors.set(false);
    this.step.set('details');
  }

  goToReview(): void {
    const max = this.lineTotal(this.selectedItem() ?? {});
    const amount = this.form.controls.requestedRefundAmount.value;
    if (amount <= 0 || amount > max) {
      this.showFormErrors.set(true);
      return;
    }
    this.showFormErrors.set(false);
    this.step.set('review');
  }

  back(): void {
    const current = this.step();
    if (current === 'item') {
      this.step.set('order');
      return;
    }
    if (current === 'reason') {
      this.step.set(this.selectedOrder() && !this.route.snapshot.queryParamMap.get('orderDetailId') ? 'item' : 'order');
      return;
    }
    if (current === 'details') {
      this.step.set('reason');
      return;
    }
    if (current === 'review') {
      this.step.set('details');
    }
  }

  reasonLabelKey(): string {
    const id = this.form.controls.reasonId.value;
    return this.reasonOptions.find((opt) => opt.id === id)?.labelKey ?? '';
  }

  resolvedReason(): string {
    const id = this.form.controls.reasonId.value;
    const option = this.reasonOptions.find((opt) => opt.id === id);
    if (!option) {
      return '';
    }
    if (id === 'other') {
      return this.form.controls.otherReason.value.trim();
    }
    return this.translate.instant(option.labelKey);
  }

  submit(): void {
    const order = this.selectedOrder();
    const item = this.selectedItem();
    if (!order?.id || !item?.id || !this.validateReason()) {
      this.showFormErrors.set(true);
      return;
    }

    const amount = this.form.controls.requestedRefundAmount.value;
    const max = this.lineTotal(item);
    if (amount <= 0 || amount > max) {
      this.showFormErrors.set(true);
      return;
    }

    this.submitting.set(true);
    this.returnsApi
      .createReturn({
        orderId: order.id,
        orderDetailId: item.id,
        reason: this.resolvedReason(),
        requestedRefundAmount: amount,
        notes: this.form.controls.notes.value.trim() || undefined,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (created) => {
          if (!created) {
            this.toast.error(this.translate.instant('RETURNS.CREATE_FAILED'));
            return;
          }
          this.createdReturn.set(created);
          this.step.set('success');
          this.toast.success(this.translate.instant('RETURNS.CREATE_SUCCESS'));
        },
        error: () => this.toast.error(this.translate.instant('RETURNS.CREATE_FAILED')),
      });
  }

  viewCreatedReturn(): void {
    const created = this.createdReturn();
    if (created?.id) {
      void this.router.navigate(['/account/returns', created.id]);
    }
  }

  private bootstrap(orderId: number | null, orderDetailId: number | null): void {
    const customerId = this.resolveCustomerId();
    if (customerId <= 0) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    forkJoin({
      orders: this.ordersApi.getCustomerOrders(customerId),
      returns: this.returnsApi.getCustomerReturns(customerId),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ orders, returns }) => {
          this.orders.set(orders);
          this.existingReturns.set(returns.items);

          if (orderId) {
            const order = orders.find((o) => o.id === orderId) ?? null;
            if (!order || !canRequestReturnForOrder(order)) {
              this.toast.error(this.translate.instant('RETURNS.ORDER_NOT_ELIGIBLE'));
              this.step.set('order');
              return;
            }
            this.loadSelectedOrderDetails(order, orderDetailId);
            return;
          }

          this.step.set('order');
        },
        error: () => {
          this.orders.set([]);
          this.existingReturns.set([]);
          this.step.set('order');
        },
      });
  }

  private loadSelectedOrderDetails(order: EcOrderDto, orderDetailId?: number | null): void {
    this.selectedOrder.set(order);
    this.selectedItem.set(null);
    this.itemLoading.set(true);
    this.step.set('item');

    this.ordersApi
      .getOrderDetails(order.id)
      .pipe(finalize(() => this.itemLoading.set(false)))
      .subscribe({
        next: (details) => {
          const selected = details ?? order;
          this.selectedOrder.set(selected);

          if (!orderDetailId) {
            return;
          }

          const item = selected.items?.find((i) => i.id === orderDetailId) ?? null;
          if (!item || !this.canReturnItem(item)) {
            this.toast.error(this.translate.instant('RETURNS.ITEM_NOT_ELIGIBLE'));
            return;
          }

          this.selectedItem.set(item);
          this.form.patchValue({ requestedRefundAmount: this.lineTotal(item) });
          this.step.set('reason');
        },
        error: () => {
          this.selectedOrder.set(order);
        },
      });
  }

  private validateReason(): boolean {
    const reasonId = this.form.controls.reasonId.value;
    if (!reasonId) {
      return false;
    }
    if (reasonId === 'other' && !this.form.controls.otherReason.value.trim()) {
      return false;
    }
    return true;
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
