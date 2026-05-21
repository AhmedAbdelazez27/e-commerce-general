import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

import { CartService } from '../../../../core/services/cart.service';
import { LanguageService } from '../../../../core/services/language.service';
import { productDisplayName } from '../../../../core/utils/product-display.util';
import { CartApiService } from '../../../cart/services/cart-api.service';
import { CartDto } from '../../../cart/models/cart.model';
import { ProductDetailDto } from '../../models/product.model';
import { CatalogApiService } from '../../services/catalog-api.service';

@Component({
  selector: 'app-product-detail-page',
  imports: [DecimalPipe, FormsModule, RouterLink, TranslateModule],
  templateUrl: './product-detail-page.component.html',
})
export class ProductDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly cartApi = inject(CartApiService);
  private readonly cartService = inject(CartService);
  private readonly language = inject(LanguageService);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);

  protected readonly product = signal<ProductDetailDto | null>(null);
  protected readonly loading = signal(true);
  protected quantity = 1;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      this.loading.set(false);
      return;
    }

    this.catalogApi.getProductById(id).subscribe({
      next: (item) => {
        this.product.set(item);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected displayName(): string {
    const p = this.product();
    if (!p) {
      return '';
    }
    return productDisplayName(p, this.language.currentLang());
  }

  protected addToCart(): void {
    const p = this.product();
    if (!p) {
      return;
    }

    const qty = Math.max(1, this.quantity);
    this.cartApi.addItem({ ProductId: p.Id, Quantity: qty }).subscribe({
      next: (cart) => this.onCartUpdated(cart),
      error: () => this.addToGuestCart(p.Id, qty, p.Price, this.displayName()),
    });
  }

  private addToGuestCart(productId: number, quantity: number, unitPrice: number, name: string): void {
    const existing = this.cartService.cart() ?? { Items: [] };
    const items = [...(existing.Items ?? [])];
    const idx = items.findIndex((i) => i.ProductId === productId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], Quantity: items[idx].Quantity + quantity };
    } else {
      items.push({ ProductId: productId, ProductName: name, Quantity: quantity, UnitPrice: unitPrice });
    }
    const cart: CartDto = { Items: items, SubTotal: this.sum(items), Total: this.sum(items) };
    this.cartService.setGuestCart(cart);
    this.toastr.success(this.translate.instant('CART.ADDED'));
  }

  private onCartUpdated(cart: CartDto): void {
    this.cartService.refresh();
    this.toastr.success(this.translate.instant('CART.ADDED'));
  }

  private sum(items: CartDto['Items']): number {
    return items.reduce((t, i) => t + i.UnitPrice * i.Quantity, 0);
  }
}
