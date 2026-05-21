import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-shell-navbar',
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './shell-navbar.component.html',
})
export class ShellNavbarComponent {
  protected readonly cart = inject(CartService);
}
