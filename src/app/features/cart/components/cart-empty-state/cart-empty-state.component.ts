import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cart-empty-state',
  imports: [RouterLink, TranslateModule],
  templateUrl: './cart-empty-state.component.html',
})
export class CartEmptyStateComponent {}
