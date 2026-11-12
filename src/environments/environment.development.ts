import { FIREBASE_WEB_CONFIG } from './firebase.config';
import { AppEnvironment } from './environment.model';

/** Local API — `ng serve` / `ng build --configuration=develop`. */
export const environment: AppEnvironment = {
    production: false,
  name: 'develop',
  // Endpoints include /api; IIS hosts the API application under /api.
  apiBaseUrl: 'https://nissanerp.com/api',
  tenancyName: 'Muhtaseb',
  appName: 'TenxMarket',
  defaultLang: 'en',
  enableSocialLogin: true,
  // Google Cloud → Authorized JavaScript origins must include the exact page origin.
  googleClientId: '811170436036-5vi9egvrnv7hpa01vvpep4lidks8g4cl.apps.googleusercontent.com',
  // Meta App must be Active; FB.login needs HTTPS (or localhost). Prefer: npm run start:ssl
  facebookAppId: '1634206791008091',
  attachmentsBaseUrl: 'https://nissanerp.com/attachment',
  enablePushNotifications: true,
  firebase: FIREBASE_WEB_CONFIG,
};


// {
//   production: false,
//   name: 'develop',
//   apiBaseUrl: 'http://localhost:20120/',
//   appName: 'TenxMarket',
//   defaultLang: 'ar',
//   enableSocialLogin: true,
//   // Google Cloud → Authorized JavaScript origins must include the exact page origin.
//   googleClientId: '811170436036-5vi9egvrnv7hpa01vvpep4lidks8g4cl.apps.googleusercontent.com',
//   // Meta App must be Active; FB.login needs HTTPS (or localhost). Prefer: npm run start:ssl
//   facebookAppId: '1634206791008091',
//   attachmentsBaseUrl: 'http://compassint.ddns.net:2042',
//   enablePushNotifications: true,
//   firebase: FIREBASE_WEB_CONFIG,
// };
