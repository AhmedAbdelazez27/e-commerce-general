import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { resultFromAbpEnvelope } from '../../../core/utils/api-envelope.util';
import type { CustomerAddressDto, CustomerAddressInput, PagedAddressesResult } from '../models/customer-address.model';
import { normalizeAddress, normalizePagedAddresses } from '../utils/checkout-api.mapper';

@Injectable({ providedIn: 'root' })
export class CustomerAddressApiService {
  private readonly http = inject(HttpClient);

  getAddresses(customerId: number): Observable<CustomerAddressDto[]> {
    const params = new HttpParams()
      .set('Params.CustomerId', String(customerId))
      .set('MaxResultCount', '100')
      .set('SkipCount', '0');

    return this.http.get<unknown>(ApiEndpoints.EcCustomerAddresses.getAll, { params }).pipe(
      map((res) => {
        const payload = resultFromAbpEnvelope<PagedAddressesResult | unknown>(res);
        if (payload && typeof payload === 'object' && 'items' in (payload as object)) {
          return normalizePagedAddresses(payload).items;
        }
        return normalizePagedAddresses(payload).items;
      }),
    );
  }

  createAddress(body: CustomerAddressInput): Observable<CustomerAddressDto | null> {
    return this.http.post<unknown>(ApiEndpoints.EcCustomerAddresses.create, body).pipe(
      map((res) => normalizeAddress(resultFromAbpEnvelope(res))),
    );
  }

  updateAddress(body: CustomerAddressInput & { id: number }): Observable<CustomerAddressDto | null> {
    return this.http.put<unknown>(ApiEndpoints.EcCustomerAddresses.update, body).pipe(
      map((res) => normalizeAddress(resultFromAbpEnvelope(res))),
    );
  }

  deleteAddress(id: number): Observable<void> {
    const params = new HttpParams().set('Id', String(id));

    return this.http.delete<unknown>(ApiEndpoints.EcCustomerAddresses.delete, { params }).pipe(
      map(() => undefined),
    );
  }
}
