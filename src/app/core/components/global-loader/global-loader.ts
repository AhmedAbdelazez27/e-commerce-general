import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-global-loader',
  templateUrl: './global-loader.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalLoaderComponent {
  protected readonly loader = inject(LoaderService);
}
