import { AppEnvironment } from './environment.model';

/** Default build (production file replacement for release builds). */
export const environment: AppEnvironment = {
  production: false,
  name: 'develop',
  apiBaseUrl: 'http://compassint.ddns.net:2029',
  appName: 'E-Commerce Store',
  defaultLang: 'en',
};
