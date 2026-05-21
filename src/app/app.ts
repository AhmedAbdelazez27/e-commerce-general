import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { GlobalLoaderComponent } from './core/components/global-loader/global-loader';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalLoaderComponent],
  templateUrl: './app.html',
})
export class App {}
