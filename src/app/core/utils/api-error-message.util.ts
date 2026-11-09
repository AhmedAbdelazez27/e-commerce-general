/** ABP transport/business errors are display text, never business-rule selectors. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;
  const e = error as {
    error?: { error?: { message?: string }; message?: string };
    message?: string;
  };
  return (
    e.error?.error?.message?.trim() ||
    e.error?.message?.trim() ||
    (error instanceof Error && !('status' in error) ? error.message : '') ||
    fallback
  );
}
