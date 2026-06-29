import { HttpContextToken } from '@angular/common/http';

export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

export const SKIP_API_BASE = new HttpContextToken<boolean>(() => false);

/** Skip global 401 session handling (e.g. wrong credentials on login). */
export const SKIP_UNAUTHORIZED_HANDLING = new HttpContextToken<boolean>(() => false);

/** Skip Abp.TenantId header (e.g. while resolving tenant via IsTenantAvailable). */
export const SKIP_TENANT_HEADER = new HttpContextToken<boolean>(() => false);

/** Skip the global loader (e.g. silent background polls like the notification badge). */
export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);
