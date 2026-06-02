import { AppEnvironment } from './environment.model';

/** Local API — `ng serve` / `ng build --configuration=develop`. */
export const environment: AppEnvironment = {
  production: false,
  name: 'develop',
  apiBaseUrl: 'http://compassint.ddns.net:2029',
  appName: 'E-Commerce Store',
  defaultLang: 'ar',
};
