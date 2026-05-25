import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { HomeOfferCard } from '../../models/home.model';

@Component({
  selector: 'app-home-offers',
  imports: [RouterLink, TranslateModule, SectionHeaderComponent],
  templateUrl: './home-offers.component.html',
})
export class HomeOffersComponent {
  readonly offers = input.required<HomeOfferCard[]>();
}
