import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-section-header',
  imports: [RouterLink, TranslateModule],
  templateUrl: './section-header.component.html',
})
export class SectionHeaderComponent {
  readonly titleKey = input.required<string>();
  readonly subtitleKey = input<string>();
  readonly viewAllRoute = input<string | string[]>();
  readonly viewAllQuery = input<Record<string, string>>();
  readonly viewAllLabelKey = input('HOME.VIEW_ALL');
}
