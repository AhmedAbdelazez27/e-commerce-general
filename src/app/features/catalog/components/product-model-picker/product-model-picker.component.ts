import { DecimalPipe } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { merge } from 'rxjs';
import {
  CartActionsService,
  CartModelSelection,
} from '../../../../core/services/cart-actions.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { LanguageService } from '../../../../core/services/language.service';
import { CurrencyCodeComponent } from '../../../../shared/components/currency-code/currency-code.component';
import { stockStatus, validQuantity } from '../../../../shared/utils/product-stock.util';
import { ProductDetail, ProductDetailVariant } from '../../models/product-detail.model';
import { ProductDetailService } from '../../services/product-detail.service';
import { pickProductDetailPosterUrl } from '../../utils/catalog-media.util';

@Component({
  selector: 'app-product-model-picker',
  imports: [DecimalPipe, RouterLink, TranslateModule, CurrencyCodeComponent],
  templateUrl: './product-model-picker.component.html',
  styleUrl: './product-model-picker.component.scss',
})
export class ProductModelPickerComponent implements OnInit {
  readonly request = input.required<CartModelSelection>();
  private readonly details = inject(ProductDetailService);
  private readonly actions = inject(CartActionsService);
  private readonly language = inject(LanguageService);
  private readonly currency = inject(CurrencyService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private sequence = 0;
  readonly product = signal<ProductDetail | null>(null);
  readonly variants = signal<ProductDetailVariant[]>([]);
  readonly selectedId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly selecting = signal(false);
  readonly submitting = signal(false);
  readonly error = signal(false);
  readonly stockStatus = stockStatus;
  readonly name = computed(() =>
    this.language.currentLang() === 'ar' ? this.product()?.nameAr : this.product()?.nameEn,
  );
  readonly image = computed(() => pickProductDetailPosterUrl(this.product()?.images ?? []));
  readonly canAdd = computed(() => {
    const p = this.product();
    return (
      !!p &&
      !!this.selectedId() &&
      p.productVariantId === this.selectedId() &&
      p.isAvailable &&
      !this.loading() &&
      !this.selecting() &&
      !this.submitting() &&
      !this.error() &&
      validQuantity(this.request().quantity, p.stock)
    );
  });

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
    this.destroyRef.onDestroy(() => {
      ++this.sequence;
      this.dialog().nativeElement.close();
    });
    merge(this.currency.currencyChanged$, this.translate.onLangChange)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.load());
    this.actions.availabilityRefreshed.pipe(takeUntilDestroyed()).subscribe((value) => {
      const p = this.product();
      if (p && value.productId === p.id && value.productVariantId === p.productVariantId)
        this.product.set({
          ...p,
          stock: value.stock,
          stockQuantity: value.stock?.available ?? 0,
          isAvailable: value.isAvailable,
        });
    });
  }
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    const sequence = ++this.sequence;
    this.loading.set(true);
    this.error.set(false);
    this.selecting.set(false);
    this.selectedId.set(null);
    this.product.set(null);
    this.variants.set([]);
    this.details
      .load({ productId: this.request().productId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (sequence !== this.sequence) return;
          this.product.set(result.product);
          this.variants.set(result.variants);
          this.loading.set(false);
          this.error.set(!result.product);
        },
        error: () => {
          if (sequence === this.sequence) {
            this.loading.set(false);
            this.error.set(true);
          }
        },
      });
  }
  select(variant: ProductDetailVariant): void {
    const product = this.product();
    if (!product || this.submitting()) return;
    const sequence = ++this.sequence;
    this.selectedId.set(variant.id);
    this.selecting.set(true);
    this.error.set(false);
    this.details
      .selectVariant(product, variant, this.request().quantity)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (selected) => {
          if (sequence !== this.sequence) return;
          this.product.set(selected);
          this.selecting.set(false);
        },
        error: () => {
          if (sequence === this.sequence) {
            this.selecting.set(false);
            this.error.set(true);
          }
        },
      });
  }
  add(): void {
    const product = this.product();
    if (!product || !this.canAdd()) return;
    this.submitting.set(true);
    const request = this.request();
    this.actions.addProductDetailThen(
      product,
      request.quantity,
      () => {
        this.actions.modelSelection.set(null);
        request.onSuccess?.();
      },
      () => this.submitting.set(false),
    );
  }
  close(event?: Event): void {
    event?.preventDefault();
    if (!this.submitting()) this.actions.modelSelection.set(null);
  }
  backdrop(event: MouseEvent): void {
    if (event.target !== this.dialog().nativeElement) return;
    const bounds = this.dialog().nativeElement.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      this.close();
  }
}
