import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import type { CrmContactUsCreateRequest } from '../models/contact-form.model';

@Injectable({ providedIn: 'root' })
export class ContactApiService {
  private readonly http = inject(HttpClient);

  createByTenancyName(body: CrmContactUsCreateRequest): Observable<unknown> {
    return this.http.post<unknown>(ApiEndpoints.CrmContactUs.createByTenancyName, body);
  }
}
