import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { dataArrayFromEnvelope, resultFromAbpEnvelope } from '../../../core/utils/api-envelope.util';
import type { CustomerProfileDto, UpdateProfileInput } from '../models/customer-profile.model';
import { OrderListItemDto } from '../models/order.model';
import { normalizeCustomerProfile } from '../utils/account-profile.mapper';

@Injectable({ providedIn: 'root' })
export class AccountApiService {
  private readonly http = inject(HttpClient);

  /** @deprecated Use AccountOrdersApiService.getCustomerOrders */
  getMyOrders(): Observable<OrderListItemDto[]> {
    return this.http.get<unknown>(ApiEndpoints.Account.orders).pipe(
      map((res) => dataArrayFromEnvelope<OrderListItemDto>(res)),
      catchError(() => of([])),
    );
  }

  getMyProfile(): Observable<CustomerProfileDto | null> {
    return this.http.get<unknown>(ApiEndpoints.EcCustomerProfile.getMyProfile).pipe(
      map((res) => normalizeCustomerProfile(resultFromAbpEnvelope(res))),
    );
  }

  updateProfile(body: UpdateProfileInput): Observable<CustomerProfileDto | null> {
    return this.http.put<unknown>(ApiEndpoints.EcCustomerProfile.updateProfile, body).pipe(
      map((res) => normalizeCustomerProfile(resultFromAbpEnvelope(res))),
    );
  }
}
