import { AppEnvironment } from './environment.model';

/** Local API — `ng serve` / `ng build --configuration=develop`. */
export const environment: AppEnvironment = {
  production: false,
  name: 'develop',
  apiBaseUrl: 'http://localhost:58104',
  appName: 'E-Commerce Store',
  defaultLang: 'ar',
};
