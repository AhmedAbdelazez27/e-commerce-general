import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { dataArrayFromEnvelope } from '../../../core/utils/api-envelope.util';
import { OrderListItemDto } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class AccountApiService {
  private readonly http = inject(HttpClient);

  getMyOrders(): Observable<OrderListItemDto[]> {
    return this.http.get<unknown>(ApiEndpoints.Account.orders).pipe(
      map((res) => dataArrayFromEnvelope<OrderListItemDto>(res)),
      catchError(() => of([])),
    );
  }
}
