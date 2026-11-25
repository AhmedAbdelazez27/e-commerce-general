import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { environment } from '../../../environments/environment.stage';
import { AppEnvironment } from '../../../environments/environment.model';
import { apiBaseUrlInterceptor } from '../interceptors/api-base-url.interceptor';
import { tenantInterceptor } from '../interceptors/tenant.interceptor';
import { APP_ENVIRONMENT } from '../tokens/app-environment.token';
import { resolveAttachmentUrl } from '../utils/attachment-url.util';
import { TenantService } from './tenant.service';

describe('staging tenant and API configuration', () => {
  let env: AppEnvironment;
  let service: TenantService;
  let http: HttpClient;
  let requests: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem('tenancy_name');
    localStorage.removeItem('tenant_id');
    env = { ...environment };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiBaseUrlInterceptor, tenantInterceptor])),
        provideHttpClientTesting(),
        { provide: APP_ENVIRONMENT, useValue: env },
      ],
    });
    service = TestBed.inject(TenantService);
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
    vi.stubGlobal('window', { location: { hostname: 'compassint.ddns.net' } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.removeItem('tenancy_name');
    localStorage.removeItem('tenant_id');
    requests.verify();
  });

  it.each(['compassint.ddns.net', 'muhtaseb.nissanerp.com'])(
    'selects Muhtaseb on %s and sends the resolved ID to the Nissan API',
    async (hostname) => {
      vi.stubGlobal('window', { location: { hostname } });
      localStorage.setItem('tenancy_name', 'compassint');
      localStorage.setItem('tenant_id', '99');
      const initialization = service.initFromHost();
      const lookup = requests.expectOne(
        'https://nissanerp.com/api/api/services/app/Account/IsTenantAvailable',
      );
      expect(lookup.request.body).toEqual({ tenancyName: 'Muhtaseb' });
      expect(lookup.request.headers.has('Abp.TenantId')).toBe(false);
      lookup.flush({ result: { state: 1, tenantId: 1 }, success: true });
      await initialization;

      http.get('/api/services/app/EcPublicSettings/GetPortalConfiguration').subscribe();
      const portal = requests.expectOne(
        'https://nissanerp.com/api/api/services/app/EcPublicSettings/GetPortalConfiguration',
      );
      expect(portal.request.headers.get('Abp.TenantId')).toBe('1');
      portal.flush({ result: {}, success: true });
      expect(service.tenancyName()).toBe('Muhtaseb');
    },
  );

  it('keeps hostname selection when no explicit tenant is configured', async () => {
    delete env.tenancyName;
    const initialization = service.initFromHost();
    const lookup = requests.expectOne(
      'https://nissanerp.com/api/api/services/app/Account/IsTenantAvailable',
    );
    expect(lookup.request.body).toEqual({ tenancyName: 'compassint' });
    lookup.flush({ result: { state: 1, tenantId: 2 }, success: true });
    await initialization;
    expect(service.tenantId()).toBe(2);
  });

  it('uses the staging attachment route without an extra ERPAttachments folder', () => {
    expect(
      resolveAttachmentUrl('/AppAttachments/ECommerce/logo.png', env.attachmentsBaseUrl),
    ).toBe('https://nissanerp.com/attachment/AppAttachments/ECommerce/logo.png');
  });
});
