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
