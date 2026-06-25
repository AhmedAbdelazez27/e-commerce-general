import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiEndpoints } from '../constants/api-endpoints';
import { SKIP_AUTH, SKIP_TENANT_HEADER } from '../http/http-context.tokens';
import { resultFromAbpEnvelope } from '../utils/api-envelope.util';

type TenantAvailabilityResult = {
  state?: number;
  tenantId?: number | null;
};

const STORAGE_TENANCY = 'tenancy_name';
const STORAGE_TENANT_ID = 'tenant_id';
const LOCALHOST_DEFAULT_TENANCY = 'compassint';//compassint

/** ABP TenantAvailabilityState.Available */
const TENANT_STATE_AVAILABLE = 1;

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly http = inject(HttpClient);

  readonly tenancyName = signal<string | null>(null);
  readonly tenantId = signal<number | null>(null);

  async initFromHost(): Promise<void> {
    const tenancy = this.detectTenancyName(window.location.hostname);
    const fromStorage = this.readFromStorage();

    if (fromStorage && fromStorage.tenancyName === tenancy) {
      this.tenancyName.set(fromStorage.tenancyName);
      this.tenantId.set(fromStorage.tenantId);
      return;
    }

    if (!tenancy) {
      this.tenancyName.set(null);
      this.tenantId.set(null);
      this.persist(null, null);
      return;
    }

    const context = new HttpContext().set(SKIP_AUTH, true).set(SKIP_TENANT_HEADER, true);
    const res = await firstValueFrom(
      this.http.post<unknown>(
        ApiEndpoints.Account.isTenantAvailable,
        { tenancyName: tenancy },
        { context },
      ),
    ).catch(() => null);

    const result = res ? resultFromAbpEnvelope<TenantAvailabilityResult>(res) : null;
    const state = result?.state ?? null;
    const id = typeof result?.tenantId === 'number' ? result.tenantId : null;

    if (state === TENANT_STATE_AVAILABLE && id != null) {
      this.tenancyName.set(tenancy);
      this.tenantId.set(id);
      this.persist(tenancy, id);
      return;
    }

    this.tenancyName.set(null);
    this.tenantId.set(null);
    this.persist(null, null);
  }

  private detectTenancyName(hostname: string): string | null {
    const host = hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return LOCALHOST_DEFAULT_TENANCY;
    }
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      return null;
    }
    const parts = host.split('.').filter(Boolean);
    if (parts.length < 3) {
      return null;
    }
    return parts[0] || null;
  }

  private readFromStorage(): { tenancyName: string | null; tenantId: number | null } | null {
    try {
      const tenancyName = localStorage.getItem(STORAGE_TENANCY);
      const idRaw = localStorage.getItem(STORAGE_TENANT_ID);
      const tenantId = idRaw ? Number(idRaw) : null;
      if (tenancyName && !Number.isNaN(tenantId) && tenantId != null) {
        return { tenancyName, tenantId };
      }
      return null;
    } catch {
      return null;
    }
  }

  private persist(tenancyName: string | null, tenantId: number | null): void {
    try {
      if (tenancyName && tenantId != null) {
        localStorage.setItem(STORAGE_TENANCY, tenancyName);
        localStorage.setItem(STORAGE_TENANT_ID, String(tenantId));
      } else {
        localStorage.removeItem(STORAGE_TENANCY);
        localStorage.removeItem(STORAGE_TENANT_ID);
      }
    } catch {
      // ignore storage errors
    }
  }
}
