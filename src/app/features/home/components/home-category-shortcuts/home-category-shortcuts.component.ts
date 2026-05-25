import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { HomeCategoryShortcut } from '../../models/home.model';

@Component({
  selector: 'app-home-category-shortcuts',
  imports: [DecimalPipe, RouterLink, TranslateModule, SectionHeaderComponent],
  templateUrl: './home-category-shortcuts.component.html',
})
export class HomeCategoryShortcutsComponent {
  readonly categories = input.required<HomeCategoryShortcut[]>();
}
