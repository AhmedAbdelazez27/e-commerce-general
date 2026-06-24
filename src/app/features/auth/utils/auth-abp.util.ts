import { HttpErrorResponse } from '@angular/common/http';

import { resultFromAbpEnvelope } from '../../../core/utils/api-envelope.util';
import { LoginDataDto } from '../models/login.models';

type JsonRecord = Record<string, unknown>;

function readString(obj: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

function readNumber(obj: JsonRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const n = Number(value);
      if (!Number.isNaN(n)) {
        return n;
      }
    }
  }
  return undefined;
}

export function createdEntityId(res: unknown): number | null {
  const result = resultFromAbpEnvelope<JsonRecord>(res);
  if (!result) {
    return null;
  }
  const id = readNumber(result, 'id', 'Id');
  return id ?? null;
}

export function abpRequestSucceeded(res: unknown): boolean {
  if (res == null || typeof res !== 'object') {
    return false;
  }
  const envelope = res as JsonRecord;
  const success = envelope['success'] ?? envelope['Success'];
  return success !== false;
}

export function abpErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof HttpErrorResponse)) {
    return fallback;
  }
  const body = err.error as JsonRecord | null;
  if (!body || typeof body !== 'object') {
    return fallback;
  }
  const error = body['error'] as JsonRecord | undefined;
  if (error && typeof error['message'] === 'string') {
    return error['message'];
  }
  if (typeof body['message'] === 'string') {
    return body['message'];
  }
  return fallback;
}

/** Maps ABP TokenAuth `result` to stored session shape. */
export function parseTokenAuthEnvelope(
  res: unknown,
  fallbackEmail?: string,
): LoginDataDto | null {
  return parseTokenAuthEnvelopeDetailed(res, fallbackEmail)?.loginData ?? null;
}

export function parseTokenAuthEnvelopeDetailed(
  res: unknown,
  fallbackEmail?: string,
): { loginData: LoginDataDto; customerId: string | null } | null {
  const result = resultFromAbpEnvelope<JsonRecord>(res);
  if (!result) {
    return null;
  }

  const token = readString(result, 'accessToken', 'AccessToken');
  if (!token) {
    return null;
  }

  const userId = readNumber(result, 'userId', 'UserId');
  const expireSeconds = readNumber(result, 'expireInSeconds', 'ExpireInSeconds') ?? 0;
  const validTo =
    expireSeconds > 0
      ? new Date(Date.now() + expireSeconds * 1000).toISOString()
      : '';

  const customer = result['customer'];
  const customerId =
    customer && typeof customer === 'object'
      ? readNumber(customer as JsonRecord, 'id', 'Id')
      : undefined;

  const displayName =
    readString(result, 'userName', 'UserName', 'name', 'Name') ?? fallbackEmail ?? '';

  return {
    loginData: {
      Token: token,
      RefreshToken: readString(result, 'refreshToken', 'RefreshToken') ?? '',
      UserId: userId != null ? String(userId) : '',
      TokenValidTo: validTo,
      NameEn: displayName,
      NameAr: displayName,
      Email: fallbackEmail ?? '',
    },
    customerId: customerId != null ? String(customerId) : null,
  };
}

function readBoolean(obj: JsonRecord, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return false;
}

/** Maps ExternalAuthenticateECommerce `result` to session + profile-completion flag. */
export function parseExternalAuthEnvelopeDetailed(
  res: unknown,
): { loginData: LoginDataDto; customerId: string | null; requiresProfileCompletion: boolean } | null {
  const parsed = parseTokenAuthEnvelopeDetailed(res);
  if (!parsed) {
    return null;
  }

  const result = resultFromAbpEnvelope<JsonRecord>(res);
  const requiresProfileCompletion = result
    ? readBoolean(result, 'requiresProfileCompletion', 'RequiresProfileCompletion')
    : false;

  return {
    ...parsed,
    requiresProfileCompletion,
  };
}

export function splitFullName(fullName: string): { name: string; surname: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { name: '', surname: '' };
  }
  if (parts.length === 1) {
    return { name: parts[0], surname: '' };
  }
  return { name: parts[0], surname: parts.slice(1).join(' ') };
}
