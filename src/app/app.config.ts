import {
  ApplicationConfig,
  APP_INITIALIZER,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideToastr } from 'ngx-toastr';

import { BundledJsonTranslateLoader } from './i18n/bundled-json-translate-loader';
import { apiBaseUrlInterceptor } from './core/interceptors/api-base-url.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { unauthorizedInterceptor } from './core/interceptors/unauthorized.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { tenantInterceptor } from './core/interceptors/tenant.interceptor';
import { LanguageService } from './core/services/language.service';
import { TenantService } from './core/services/tenant.service';
import { PortalConfigService } from './core/portal-config/portal-config.service';
import { APP_ENVIRONMENT } from './core/tokens/app-environment.token';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

function initAppFactory(
  tenants: TenantService,
  lang: LanguageService,
  portal: PortalConfigService,
) {
  return async () => {
    await tenants.initFromHost();
    await lang.initFromStorage();
    await portal.load();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    { provide: APP_ENVIRONMENT, useValue: environment },
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        loadingInterceptor,
        apiBaseUrlInterceptor,
        tenantInterceptor,
        authInterceptor,
        unauthorizedInterceptor,
        errorInterceptor,
      ]),
    ),
    importProvidersFrom(
      TranslateModule.forRoot({
        fallbackLang: 'en',
        lang: environment.defaultLang,
        loader: { provide: TranslateLoader, useClass: BundledJsonTranslateLoader },
      }),
    ),
    provideToastr({
      timeOut: 5000,
      closeButton: true,
      progressBar: true,
      preventDuplicates: true,
      newestOnTop: true,
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initAppFactory,
      deps: [TenantService, LanguageService, PortalConfigService],
      multi: true,
    },
  ],
};
