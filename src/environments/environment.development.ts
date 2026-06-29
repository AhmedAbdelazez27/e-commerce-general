import { FIREBASE_WEB_CONFIG } from './firebase.config';
import { AppEnvironment } from './environment.model';

/** Local API — `ng serve` / `ng build --configuration=develop`. */
export const environment: AppEnvironment = {
  production: false,
  name: 'develop',
  apiBaseUrl: 'http://compassint.ddns.net:2029',
  appName: 'TenxMarket',
  defaultLang: 'ar',
  enableSocialLogin: true,
  googleClientId: '811170436036-5vi9egvrnv7hpa01vvpep4lidks8g4cl.apps.googleusercontent.com',
  facebookAppId: '1256194259769527',
  attachmentsBaseUrl: 'http://compassint.ddns.net:2042',
  enablePushNotifications: true,
  firebase: FIREBASE_WEB_CONFIG,
};
