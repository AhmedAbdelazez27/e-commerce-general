import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ActiveToast, IndividualConfig, ToastrService } from 'ngx-toastr';

import { LanguageService } from './language.service';

type ToastType = 'success' | 'error' | 'warning' | 'info';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly language = inject(LanguageService);

  success(message: string, title = ''): ActiveToast<unknown> {
    return this.show('success', message, title);
  }

  error(message: string, title = ''): ActiveToast<unknown> {
    return this.show('error', message, title);
  }

  warning(message: string, title = ''): ActiveToast<unknown> {
    return this.show('warning', message, title);
  }

  info(message: string, title = ''): ActiveToast<unknown> {
    return this.show('info', message, title);
  }

  /** Success toast — tap the action label to navigate. */
  successWithAction(
    message: string,
    actionLabel: string,
    route: string | string[],
  ): ActiveToast<unknown> {
    const ref = this.show('success', message, actionLabel, { tapToDismiss: true });
    ref.onTap.subscribe(() => {
      void this.router.navigate(Array.isArray(route) ? route : [route]);
    });
    return ref;
  }

  infoWithAction(
    message: string,
    actionLabel: string,
    route: string | string[],
  ): ActiveToast<unknown> {
    const ref = this.show('info', message, actionLabel, { tapToDismiss: true });
    ref.onTap.subscribe(() => {
      void this.router.navigate(Array.isArray(route) ? route : [route]);
    });
    return ref;
  }

  private show(
    type: ToastType,
    message: string,
    title = '',
    extra?: Partial<IndividualConfig>,
  ): ActiveToast<unknown> {
    const config = this.baseConfig(extra);
    switch (type) {
      case 'success':
        return this.toastr.success(message, title, config);
      case 'error':
        return this.toastr.error(message, title, config);
      case 'warning':
        return this.toastr.warning(message, title, config);
      case 'info':
        return this.toastr.info(message, title, config);
    }
  }

  private baseConfig(extra?: Partial<IndividualConfig>): Partial<IndividualConfig> {
    return {
      timeOut: 5000,
      extendedTimeOut: 1500,
      closeButton: true,
      progressBar: true,
      newestOnTop: true,
      positionClass: this.positionClass(),
      toastClass: 'app-toast ngx-toastr',
      titleClass: 'app-toast__title',
      messageClass: 'app-toast__message',
      ...extra,
    };
  }

  private positionClass(): string {
    return this.language.currentLang() === 'ar' ? 'toast-top-start' : 'toast-top-end';
  }
}
