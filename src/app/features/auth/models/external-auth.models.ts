export type ExternalAuthProvider = 'Google' | 'Facebook';

export interface ExternalAuthenticateRequest {
  provider: ExternalAuthProvider;
  idToken?: string;
  accessToken?: string;
  mobile?: string;
}

export interface ExternalAuthenticateResult {
  requiresProfileCompletion: boolean;
  accessToken: string;
  encryptedAccessToken?: string;
  expireInSeconds: number;
  userId: number;
  userName: string;
  isHost?: boolean;
  isTenentAdmin?: boolean;
  tenantDetail?: { id: number };
}
