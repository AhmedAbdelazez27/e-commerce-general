import { FIREBASE_WEB_CONFIG } from './firebase.config';
import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: false,
  name: 'stage',
  apiBaseUrl: 'http://compassint.ddns.net:2029',
  appName: 'TenxMarket',
  defaultLang: 'en',
  enableSocialLogin: true,
  // Google Cloud → Authorized JavaScript origins must include the exact page origin.
  googleClientId: '811170436036-5vi9egvrnv7hpa01vvpep4lidks8g4cl.apps.googleusercontent.com',
  // Meta App must be Active; FB.login needs HTTPS (or localhost). Prefer: npm run start:ssl
  facebookAppId: '1256194259769527',
  attachmentsBaseUrl: 'http://compassint.ddns.net:2042',
  enablePushNotifications: true,
  firebase: FIREBASE_WEB_CONFIG,
};
