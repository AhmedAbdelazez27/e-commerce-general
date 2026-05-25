import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { HomeTrustBadge } from '../../models/home.model';

@Component({
  selector: 'app-home-trust-badges',
  imports: [TranslateModule],
  templateUrl: './home-trust-badges.component.html',
})
export class HomeTrustBadgesComponent {
  readonly badges = input.required<HomeTrustBadge[]>();
}
