import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { PortalConfigService } from '../../core/portal-config/portal-config.service';
import { LAYOUT_CONFIG } from '../config/layout.config';

@Component({
  selector: 'app-store-footer',
  imports: [RouterLink, TranslateModule],
  templateUrl: './store-footer.component.html',
})
export class StoreFooterComponent {
  private readonly portal = inject(PortalConfigService);

  readonly config = LAYOUT_CONFIG.footer;
  readonly year = new Date().getFullYear();
  readonly socialLinks = this.portal.socialLinks;
  readonly contactInfo = () => this.portal.config().contactInfo;
  readonly hasContactInfo = this.portal.hasContactInfo;
  readonly enableChatSupport = this.portal.enableChatSupport;
  readonly chatSupportHref = this.portal.chatSupportHref;

  onNewsletterSubmit(event: Event): void {
    event.preventDefault();
  }
}
