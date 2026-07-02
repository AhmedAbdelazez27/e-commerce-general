import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { PortalConfigService } from '../../core/portal-config/portal-config.service';
import { resolvePortalAddress } from '../../core/portal-config/portal-contact.util';
import { LanguageService } from '../../core/services/language.service';
import { LAYOUT_CONFIG } from '../config/layout.config';

@Component({
  selector: 'app-store-footer',
  imports: [RouterLink, TranslateModule],
  templateUrl: './store-footer.component.html',
})
export class StoreFooterComponent {
  private readonly portal = inject(PortalConfigService);
  private readonly language = inject(LanguageService);

  readonly config = LAYOUT_CONFIG.footer;
  readonly year = new Date().getFullYear();
  readonly socialLinks = this.portal.socialLinks;
  readonly contactInfo = () => this.portal.config().contactInfo;
  readonly contactAddress = computed(() =>
    resolvePortalAddress(this.portal.config(), this.language.currentLang()),
  );
  readonly hasContactInfo = this.portal.hasContactInfo;
  readonly enableChatSupport = this.portal.enableChatSupport;
  readonly enableReturns = this.portal.enableReturns;
  readonly chatSupportHref = this.portal.chatSupportHref;

  readonly customerServiceLinks = computed(() =>
    this.config.customerServiceLinks.filter((link) => link.id !== 'returns' || this.enableReturns()),
  );

  onNewsletterSubmit(event: Event): void {
    event.preventDefault();
  }
}
