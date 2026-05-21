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

/** Maps API envelope (PascalCase or camelCase); ignores misleading `Success: false` when Token exists. */
export function parseLoginEnvelope(res: unknown): { data: LoginDataDto | null; message?: string } {
  const envelope = (res ?? {}) as JsonRecord;
  const payload = (envelope['Data'] ?? envelope['data']) as JsonRecord | null | undefined;

  if (!payload || typeof payload !== 'object') {
    return {
      data: null,
      message: readString(envelope, 'Message', 'message'),
    };
  }

  const token = readString(payload, 'Token', 'token');
  if (!token) {
    return {
      data: null,
      message: readString(envelope, 'Message', 'message'),
    };
  }

  return {
    data: {
      Token: token,
      RefreshToken: readString(payload, 'RefreshToken', 'refreshToken') ?? '',
      UserId: readString(payload, 'UserId', 'userId') ?? '',
      TokenValidTo: readString(payload, 'TokenValidTo', 'tokenValidTo') ?? '',
      NameEn: readString(payload, 'NameEn', 'nameEn') ?? '',
      NameAr: readString(payload, 'NameAr', 'nameAr') ?? '',
      Email: readString(payload, 'Email', 'email') ?? '',
    },
    message: readString(envelope, 'Message', 'message'),
  };
}
