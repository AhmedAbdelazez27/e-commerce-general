/** Safe guest navigation target from auth pages (login/register). */
export function resolveAuthContinueUrl(returnUrl: string | null | undefined): string {
  if (!returnUrl?.startsWith('/') || returnUrl.startsWith('/auth')) {
    return '/home';
  }

  if (returnUrl.startsWith('/checkout') || returnUrl.startsWith('/account')) {
    return '/cart';
  }

  return returnUrl;
}
