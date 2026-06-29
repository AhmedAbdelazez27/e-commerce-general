import { FIREBASE_WEB_CONFIG } from './firebase.config';
import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: true,
  name: 'production',
  apiBaseUrl: 'https://api.tenxerp.com/api',
  appName: 'TenxMarket',
  defaultLang: 'en',
  enableSocialLogin: true,
  googleClientId: '811170436036-5vi9egvrnv7hpa01vvpep4lidks8g4cl.apps.googleusercontent.com',
  facebookAppId: '1256194259769527',
  attachmentsBaseUrl: 'https://files.tenxerp.com',
  enablePushNotifications: true,
  firebase: FIREBASE_WEB_CONFIG,
};
