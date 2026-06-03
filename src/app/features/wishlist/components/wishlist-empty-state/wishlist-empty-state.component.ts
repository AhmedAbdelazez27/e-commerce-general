import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-wishlist-empty-state',
  imports: [RouterLink, TranslateModule],
  templateUrl: './wishlist-empty-state.component.html',
})
export class WishlistEmptyStateComponent {}
