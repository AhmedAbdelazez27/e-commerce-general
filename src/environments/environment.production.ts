import { FIREBASE_WEB_CONFIG } from './firebase.config';
import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: true,
  name: 'production',
  apiBaseUrl: 'https://api.tenxerp.com/api',
  appName: 'TenxMarket',
  defaultLang: 'en',
  enableSocialLogin: true,
  // Google Cloud → Authorized JavaScript origins must include the exact production origin (HTTPS).
  googleClientId: '811170436036-5vi9egvrnv7hpa01vvpep4lidks8g4cl.apps.googleusercontent.com',
  // Meta App must be Active; production must be served over HTTPS for Facebook Login.
  facebookAppId: '1256194259769527',
  attachmentsBaseUrl: 'https://files.tenxerp.com',
  enablePushNotifications: true,
  firebase: FIREBASE_WEB_CONFIG,
};
