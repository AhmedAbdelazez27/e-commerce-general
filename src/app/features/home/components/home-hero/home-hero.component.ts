import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { HomeHeroConfig } from '../../models/home.model';

@Component({
  selector: 'app-home-hero',
  imports: [RouterLink, TranslateModule],
  templateUrl: './home-hero.component.html',
})
export class HomeHeroComponent {
  readonly config = input.required<HomeHeroConfig>();
}
