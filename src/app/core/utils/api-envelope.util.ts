type JsonRecord = Record<string, unknown>;

/**
 * Reads `Data` from API envelopes. Ignores `Success` — this backend often returns
 * `Success: false` with HTTP 200 and valid `Data` (same as login).
 */
export function dataFromEnvelope<T>(res: unknown): T | null {
  if (res == null || typeof res !== 'object') {
    return null;
  }
  const envelope = res as JsonRecord;
  const payload = envelope['Data'] ?? envelope['data'];
  if (payload == null) {
    return null;
  }
  return payload as T;
}

export function dataArrayFromEnvelope<T>(res: unknown): T[] {
  const payload = dataFromEnvelope<T[]>(res);
  return Array.isArray(payload) ? payload : [];
}

/** ABP-style envelope: `{ result, success, __abp }`. */
export function resultFromAbpEnvelope<T>(res: unknown): T | null {
  if (res == null || typeof res !== 'object') {
    return null;
  }
  const envelope = res as JsonRecord;
  const payload =
    envelope['result'] ??
    envelope['Result'] ??
    envelope['Data'] ??
    envelope['data'];
  if (payload == null) {
    return null;
  }
  return payload as T;
}

export function resultArrayFromAbpEnvelope<T>(res: unknown): T[] {
  const payload = resultFromAbpEnvelope<T[]>(res);
  return Array.isArray(payload) ? payload : [];
}

/**
 * Extracts an ABP error message from an HTTP-200 envelope (`{ success: false, error: { message } }`).
 * This backend frequently returns business-rule failures with HTTP 200, so the global error
 * interceptor never sees them — call this to surface the message to the user.
 */
export function abpEnvelopeErrorMessage(res: unknown): string | null {
  if (res == null || typeof res !== 'object') {
    return null;
  }
  const envelope = res as JsonRecord;
  const error = (envelope['error'] ?? envelope['Error']) as JsonRecord | null | undefined;
  if (error && typeof error === 'object') {
    const message = error['message'] ?? error['Message'];
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }
  return null;
}
