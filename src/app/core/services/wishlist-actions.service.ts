import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

import { ProductCardData } from '../../shared/models/product-card.model';
import { resolveProductCardTitle } from '../../shared/utils/product-card.util';
import { LanguageService } from './language.service';
import { WishlistService } from './wishlist.service';

@Injectable({ providedIn: 'root' })
export class WishlistActionsService {
  private readonly wishlist = inject(WishlistService);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  toggle(product: ProductCardData): void {
    const name = resolveProductCardTitle(product, this.language.currentLang());
    const action = this.wishlist.toggle(product);

    if (action === 'added') {
      this.toastr.success(this.translate.instant('WISHLIST.ADDED_SUCCESS', { name }));
      return;
    }

    this.toastr.info(this.translate.instant('WISHLIST.REMOVED_SUCCESS', { name }));
  }
}
