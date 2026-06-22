import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../constants/api-endpoints';
import { resultFromAbpEnvelope } from '../utils/api-envelope.util';
import { PortalConfigurationDto } from './portal-configuration.model';

@Injectable({ providedIn: 'root' })
export class EcPublicSettingsApiService {
  private readonly http = inject(HttpClient);

  getPortalConfiguration(): Observable<PortalConfigurationDto | null> {
    return this.http.get<unknown>(ApiEndpoints.EcPublicSettings.getPortalConfiguration).pipe(
      map((res) => resultFromAbpEnvelope<PortalConfigurationDto>(res)),
      catchError(() => of(null)),
    );
  }
}
