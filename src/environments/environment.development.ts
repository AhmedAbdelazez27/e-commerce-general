import { AppEnvironment } from './environment.model';

/** Local API — `ng serve` / `ng build --configuration=develop`. */
export const environment: AppEnvironment = {
  production: false,
  name: 'develop',
  apiBaseUrl: 'http://compassint.ddns.net:2029',
  appName: 'E-Commerce Store',
  defaultLang: 'ar',
  enableSocialLogin: true,
  googleClientId: '811170436036-5vi9egvrnv7hpa01vvpep4lidks8g4cl.apps.googleusercontent.com',
  facebookAppId: '1256194259769527',
  attachmentsBaseUrl: 'http://compassint.ddns.net:2042',
  //  apiBaseUrl: 'https://api.tenxerp.com/api',
  // appName: 'TenxMarket',
  // defaultLang: 'en',
  // enableSocialLogin: true,
  // googleClientId: '811170436036-5vi9egvrnv7hpa01vvpep4lidks8g4cl.apps.googleusercontent.com',
  // facebookAppId: '1256194259769527',
  // attachmentsBaseUrl: 'https://tradingdemo.tenxerp.com',
};
