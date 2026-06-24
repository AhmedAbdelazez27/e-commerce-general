import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom, Subject } from 'rxjs';

import type { AppLang } from './language.service';
import type { CurrencySelection, PublicCurrencyDto } from '../models/currency.model';
import { EcPublicCatalogApiService } from '../../layout/services/ec-public-catalog-api.service';

const STORAGE_KEY = 'app_currency';

const ISO_CURRENCY_CODE = /^[A-Z]{3}$/;

function isValidCurrencyCode(code: string): boolean {
  return ISO_CURRENCY_CODE.test(code.trim().toUpperCase());
}

function normalizeCurrency(raw: PublicCurrencyDto): PublicCurrencyDto | null {
  const code = raw.code?.trim().toUpperCase();
  if (!code || !isValidCurrencyCode(code) || !Number.isFinite(raw.id) || raw.id <= 0) {
    return null;
  }

  return {
    ...raw,
    code,
    descriptionAr: raw.descriptionAr?.trim() || code,
    descriptionEn: raw.descriptionEn?.trim() || code,
  };
}

function readStoredCurrency(): CurrencySelection | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<CurrencySelection>;
    if (
      typeof parsed.id === 'number' &&
      parsed.id > 0 &&
      typeof parsed.code === 'string' &&
      isValidCurrencyCode(parsed.code)
    ) {
      return { id: parsed.id, code: parsed.code.trim().toUpperCase() };
    }
  } catch {
    return null;
  }
  return null;
}

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly catalogApi = inject(EcPublicCatalogApiService);

  private readonly currenciesSignal = signal<PublicCurrencyDto[]>([]);
  private readonly selectedSignal = signal<CurrencySelection | null>(null);

  readonly currencies = this.currenciesSignal.asReadonly();
  readonly selectedCurrency = this.selectedSignal.asReadonly();

  readonly displayCode = computed(() => this.selectedSignal()?.code ?? '');

  private readonly currencyChangedSubject = new Subject<CurrencySelection>();
  readonly currencyChanged$ = this.currencyChangedSubject.asObservable();

  private loadTask: Promise<void> | null = null;

  async init(): Promise<void> {
    await this.ensureLoaded();
  }

  /** Idempotent — safe from APP_INITIALIZER and layout components. */
  ensureLoaded(): Promise<void> {
    if (!this.loadTask) {
      this.loadTask = this.loadCurrenciesFromApi();
    }
    return this.loadTask;
  }

  private async loadCurrenciesFromApi(): Promise<void> {
    const list = (await firstValueFrom(this.catalogApi.getCurrencies()))
      .map(normalizeCurrency)
      .filter((c): c is PublicCurrencyDto => c != null);

    this.currenciesSignal.set(list);
    this.applyDefaultSelection(list);
  }

  private applyDefaultSelection(list: PublicCurrencyDto[]): void {
    const stored = readStoredCurrency();
    const storedMatch = stored ? list.find((c) => c.id === stored.id && c.code === stored.code) : null;
    const local = list.find((c) => c.isLocalCurrency) ?? list[0] ?? null;

    const selected = storedMatch ?? (local ? { id: local.id, code: local.code } : null);
    this.selectedSignal.set(selected);
    if (selected) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    }
  }

  selection(): CurrencySelection {
    const selected = this.selectedSignal();
    if (selected) {
      return selected;
    }
    const local = this.currenciesSignal().find((c) => c.isLocalCurrency) ?? this.currenciesSignal()[0];
    if (local) {
      return { id: local.id, code: local.code };
    }
    return { id: 0, code: '' };
  }

  setCurrency(currency: PublicCurrencyDto | CurrencySelection): void {
    const next: CurrencySelection = {
      id: currency.id,
      code: currency.code.trim().toUpperCase(),
    };
    const current = this.selectedSignal();
    if (current?.id === next.id && current.code === next.code) {
      return;
    }

    this.selectedSignal.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.currencyChangedSubject.next(next);
  }

  displayName(lang: AppLang): string {
    const selected = this.selectedSignal();
    if (!selected) {
      return '';
    }
    const match = this.currenciesSignal().find((c) => c.id === selected.id);
    if (!match) {
      return selected.code;
    }
    return lang === 'ar' ? match.descriptionAr : match.descriptionEn;
  }
}
