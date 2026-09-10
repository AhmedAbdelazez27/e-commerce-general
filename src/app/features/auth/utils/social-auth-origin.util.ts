/**
 * Social login console setup (not enforced in code — Google/Meta dashboards).
 *
 * Google Cloud → APIs & Services → Credentials → OAuth 2.0 Client ID
 *   Client ID matches environment.googleClientId
 *   Authorized JavaScript origins (exact match, no trailing slash), e.g.:
 *   - http://localhost:4200
 *   - https://localhost:4200
 *   - https://<your-public-store-host>
 *
 * Meta for Developers → App (facebookAppId) → Facebook Login
 *   App must be Active/Live (or user must be Admin/Developer/Tester in Development)
 *   App Domains + site URL must match the store host
 *   FB.login requires HTTPS except localhost / 127.0.0.1
 */

/** Origins commonly used in local Angular serve — add these in Google Cloud. */
export const LOCAL_GOOGLE_OAUTH_ORIGINS = [
  'http://localhost:4200',
  'https://localhost:4200',
] as const;

/**
 * Facebook allows Login only on HTTPS, plus http://localhost and http://127.0.0.1.
 * @see https://developers.facebook.com/blog/post/2018/06/08/enforce-https-facebook-login/
 */
export function isFacebookLoginOriginAllowed(origin?: string | null): boolean {
  const value = (origin ?? (typeof location !== 'undefined' ? location.origin : '')).trim();
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    if (url.protocol === 'https:') {
      return true;
    }
    if (url.protocol === 'http:') {
      const host = url.hostname.toLowerCase();
      return host === 'localhost' || host === '127.0.0.1';
    }
    return false;
  } catch {
    return false;
  }
}
