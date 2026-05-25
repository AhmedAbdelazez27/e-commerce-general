import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { HomePageConfig } from '../../models/home.model';

@Component({
  selector: 'app-home-brands',
  imports: [RouterLink, TranslateModule, SectionHeaderComponent],
  templateUrl: './home-brands.component.html',
})
export class HomeBrandsComponent {
  readonly brands = input.required<HomePageConfig['brands']>();
}
