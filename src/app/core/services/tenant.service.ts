import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiEndpoints } from '../constants/api-endpoints';
import { SKIP_AUTH } from '../http/http-context.tokens';
import { resultFromAbpEnvelope } from '../utils/api-envelope.util';

type TenantAvailabilityResult = {
  state?: number;
  tenantId?: number | null;
};

const STORAGE_TENANCY = 'tenancy_name';
const STORAGE_TENANT_ID = 'tenant_id';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly http = inject(HttpClient);

  readonly tenancyName = signal<string | null>(null);
  readonly tenantId = signal<number | null>(null);

  async initFromHost(): Promise<void> {
    const fromStorage = this.readFromStorage();
    if (fromStorage) {
      this.tenancyName.set(fromStorage.tenancyName);
      this.tenantId.set(fromStorage.tenantId);
      return;
    }

    const tenancy = this.detectTenancyName(window.location.hostname);
    if (!tenancy) {
      this.persist(null, null);
      return;
    }

    const context = new HttpContext().set(SKIP_AUTH, true);
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

    // ABP: state=1 usually means Available. Anything else -> treat as host.
    if (state === 1 && id != null) {
      this.tenancyName.set(tenancy);
      this.tenantId.set(id);
      this.persist(tenancy, id);
      return;
    }

    this.persist(null, null);
  }

  private detectTenancyName(hostname: string): string | null {
    const host = hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return null;
    }
    // If hostname looks like an IP, skip.
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      return null;
    }
    const parts = host.split('.').filter(Boolean);
    // subdomain.domain.tld (at least 3 parts)
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

