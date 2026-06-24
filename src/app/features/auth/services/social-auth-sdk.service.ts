import { Injectable, inject } from '@angular/core';

import { APP_ENVIRONMENT } from '../../../core/tokens/app-environment.token';

type GoogleCredentialResponse = { credential: string };

type GoogleSignInButtonOptions = {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  width?: number;
  click_listener?: () => void;
};

type FacebookLoginResponse = {
  status: string;
  authResponse?: { accessToken: string };
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: GoogleSignInButtonOptions) => void;
        };
      };
    };
    FB?: {
      init: (params: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options: { scope: string },
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

const GOOGLE_GSI_URL = 'https://accounts.google.com/gsi/client';
const FACEBOOK_SDK_URL = 'https://connect.facebook.net/en_US/sdk.js';

@Injectable({ providedIn: 'root' })
export class SocialAuthSdkService {
  private readonly env = inject(APP_ENVIRONMENT);

  private googleScriptPromise: Promise<void> | null = null;
  private facebookScriptPromise: Promise<void> | null = null;
  private facebookInitialized = false;

  readonly socialLoginEnabled = !!this.env.enableSocialLogin;
  readonly hasGoogle = !!this.env.googleClientId?.trim();
  readonly hasFacebook = !!this.env.facebookAppId?.trim();

  /**
   * Renders the official GIS button over `host` (typically a transparent overlay).
   * User clicks must land on this button so Google opens the account picker popup.
   */
  mountGoogleSignInButton(
    host: HTMLElement,
    listeners: {
      onClick?: () => void;
      onCredential: (idToken: string) => void;
      onError?: (error: Error) => void;
    },
  ): () => void {
    const clientId = this.env.googleClientId?.trim();
    if (!clientId) {
      listeners.onError?.(new Error('GOOGLE_NOT_CONFIGURED'));
      return () => undefined;
    }

    let cancelled = false;

    void this.loadGoogleScript().then(
      () => {
        if (cancelled) {
          return;
        }
        if (!window.google?.accounts?.id) {
          listeners.onError?.(new Error('GOOGLE_SDK_UNAVAILABLE'));
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          callback: (response) => {
            const token = response?.credential?.trim();
            if (token) {
              listeners.onCredential(token);
              return;
            }
            listeners.onError?.(new Error('GOOGLE_TOKEN_MISSING'));
          },
        });

        const width = Math.max(host.offsetWidth || host.parentElement?.clientWidth || 0, 240);

        window.google.accounts.id.renderButton(host, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width,
          click_listener: () => listeners.onClick?.(),
        });
      },
      (err) => {
        if (!cancelled) {
          listeners.onError?.(err instanceof Error ? err : new Error('GOOGLE_SDK_UNAVAILABLE'));
        }
      },
    );

    return () => {
      cancelled = true;
      host.replaceChildren();
    };
  }

  signInWithFacebook(): Promise<string> {
    const appId = this.env.facebookAppId?.trim();
    if (!appId) {
      return Promise.reject(new Error('FACEBOOK_NOT_CONFIGURED'));
    }

    return this.loadFacebookSdk(appId).then(
      () =>
        new Promise<string>((resolve, reject) => {
          if (!window.FB) {
            reject(new Error('FACEBOOK_SDK_UNAVAILABLE'));
            return;
          }

          window.FB.login(
            (response) => {
              const token = response.authResponse?.accessToken?.trim();
              if (token) {
                resolve(token);
                return;
              }
              if (response.status === 'unknown' || response.status === 'not_authorized') {
                reject(new Error('FACEBOOK_LOGIN_CANCELLED'));
                return;
              }
              reject(new Error('FACEBOOK_TOKEN_MISSING'));
            },
            { scope: 'public_profile,email' },
          );
        }),
    );
  }

  private loadGoogleScript(): Promise<void> {
    if (this.googleScriptPromise) {
      return this.googleScriptPromise;
    }

    this.googleScriptPromise = this.loadScript(GOOGLE_GSI_URL, 'google-gsi-client').then(() => {
      if (!window.google?.accounts?.id) {
        throw new Error('GOOGLE_SDK_UNAVAILABLE');
      }
    });

    return this.googleScriptPromise;
  }

  private loadFacebookSdk(appId: string): Promise<void> {
    if (this.facebookInitialized && window.FB) {
      return Promise.resolve();
    }

    if (!this.facebookScriptPromise) {
      this.facebookScriptPromise = new Promise<void>((resolve, reject) => {
        window.fbAsyncInit = () => {
          try {
            window.FB?.init({
              appId,
              cookie: true,
              xfbml: false,
              version: 'v19.0',
            });
            this.facebookInitialized = true;
            resolve();
          } catch {
            reject(new Error('FACEBOOK_SDK_UNAVAILABLE'));
          }
        };

        this.loadScript(FACEBOOK_SDK_URL, 'facebook-jssdk').catch(reject);
      });
    }

    return this.facebookScriptPromise;
  }

  private loadScript(src: string, id: string): Promise<void> {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      return existing.dataset['loaded'] === 'true'
        ? Promise.resolve()
        : new Promise((resolve, reject) => {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => reject(new Error('SCRIPT_LOAD_FAILED')), {
              once: true,
            });
          });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        script.dataset['loaded'] = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error('SCRIPT_LOAD_FAILED'));
      document.head.appendChild(script);
    });
  }
}
