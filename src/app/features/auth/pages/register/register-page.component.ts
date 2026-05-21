import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-register-page',
  imports: [RouterLink, TranslateModule],
  template: `
    <div class="container py-5 text-center" style="max-width: 28rem">
      <h1 class="h3 mb-3">{{ 'AUTH.REGISTER_TITLE' | translate }}</h1>
      <p class="text-muted mb-4">{{ 'AUTH.REGISTER_PENDING' | translate }}</p>
      <a routerLink="/auth/login" class="btn btn-primary">{{ 'AUTH.BACK_LOGIN' | translate }}</a>
    </div>
  `,
})
export class RegisterPageComponent {}
