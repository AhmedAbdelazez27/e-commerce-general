import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private readonly active = signal(0);

  readonly isLoading = computed(() => this.active() > 0);

  increment(): void {
    queueMicrotask(() => this.active.update((n) => n + 1));
  }

  decrement(): void {
    queueMicrotask(() => this.active.update((n) => Math.max(0, n - 1)));
  }
}
