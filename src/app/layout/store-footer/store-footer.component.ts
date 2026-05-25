import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LAYOUT_CONFIG } from '../config/layout.config';

@Component({
  selector: 'app-store-footer',
  imports: [RouterLink, TranslateModule],
  templateUrl: './store-footer.component.html',
})
export class StoreFooterComponent {
  readonly config = LAYOUT_CONFIG.footer;
  readonly year = new Date().getFullYear();

  onNewsletterSubmit(event: Event): void {
    event.preventDefault();
  }
}
