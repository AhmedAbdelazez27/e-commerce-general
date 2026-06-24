/**
 * Runtime configuration injected as `APP_ENVIRONMENT`.
 * Extend here when adding new env-driven settings (e.g. feature flags, extra API roots).
 */
export interface AppEnvironment {
  production: boolean;
  /** Logical environment name (development, develop, stage, production). */
  name: string;
  apiBaseUrl: string;
  appName: string;
  defaultLang: string;
  /** Google Identity Services Web client ID (must match backend). */
  googleClientId?: string;
  /** Facebook Login App ID (must match backend). */
  facebookAppId?: string;
  /** Show social login buttons when client IDs are configured. */
  enableSocialLogin?: boolean;
}
