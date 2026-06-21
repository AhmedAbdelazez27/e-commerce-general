import { HttpContextToken } from '@angular/common/http';

export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

export const SKIP_API_BASE = new HttpContextToken<boolean>(() => false);

/** Skip global 401 session handling (e.g. wrong credentials on login). */
export const SKIP_UNAUTHORIZED_HANDLING = new HttpContextToken<boolean>(() => false);
