import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, TranslateModule],
  templateUrl: './home-page.component.html',
})
export class HomePageComponent {}
