import { InjectionToken } from '@angular/core';

import { AppEnvironment } from '../../../environments/environment.model';

export const APP_ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT');
