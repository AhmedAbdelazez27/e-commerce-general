import { Component, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-catalog-empty-state',
  imports: [TranslateModule],
  templateUrl: './catalog-empty-state.component.html',
})
export class CatalogEmptyStateComponent {
  readonly clearFilters = output<void>();
}
