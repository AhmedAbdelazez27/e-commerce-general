import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-brand-tile',
  imports: [DecimalPipe, RouterLink, TranslateModule],
  templateUrl: './brand-tile.component.html',
})
export class BrandTileComponent {
  readonly name = input.required<string>();
  readonly initials = input.required<string>();
  readonly logoUrl = input<string | null>(null);
  readonly description = input('');
  readonly count = input(0);
  readonly isFeatured = input(false);
  readonly route = input<string | string[]>(['/shop']);
  readonly queryParams = input<Record<string, string>>();

  readonly hasLogo = computed(() => !!this.logoUrl()?.trim());
}
