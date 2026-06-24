const EXTERNAL_AUTH_ERROR_MAP: Record<string, string> = {
  'invalid external provider.': 'AUTH.EXTERNAL_INVALID_PROVIDER',
  'invalid facebook token.': 'AUTH.EXTERNAL_INVALID_FACEBOOK',
  'invalid google token.': 'AUTH.EXTERNAL_INVALID_GOOGLE',
  'email not returned by provider.': 'AUTH.EXTERNAL_EMAIL_REQUIRED',
  'unable to create user.': 'AUTH.EXTERNAL_CREATE_USER_FAILED',
  'user is inactive.': 'AUTH.EXTERNAL_USER_INACTIVE',
};

export function externalAuthErrorKey(message: string | null | undefined): string | null {
  const normalized = message?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  return EXTERNAL_AUTH_ERROR_MAP[normalized] ?? null;
}
