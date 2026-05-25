import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { HomeCuratedCollection } from '../../models/home.model';

@Component({
  selector: 'app-home-curated-collections',
  imports: [RouterLink, TranslateModule],
  templateUrl: './home-curated-collections.component.html',
})
export class HomeCuratedCollectionsComponent {
  readonly sectionEyebrowKey = input.required<string>();
  readonly sectionTitleKey = input.required<string>();
  readonly items = input.required<HomeCuratedCollection[]>();
}
