import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { CartService } from '../../core/services/cart.service';
import { EcNotificationsService } from '../../core/services/ec-notifications.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { LAYOUT_CONFIG } from '../config/layout.config';
import { AnnouncementBarComponent } from '../announcement-bar/announcement-bar.component';
import { MobileNavDrawerComponent } from '../mobile-nav-drawer/mobile-nav-drawer.component';
import { StoreFooterComponent } from '../store-footer/store-footer.component';
import { StoreHeaderComponent } from '../store-header/store-header.component';
import { StoreNavComponent } from '../store-nav/store-nav.component';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    AnnouncementBarComponent,
    StoreHeaderComponent,
    StoreNavComponent,
    MobileNavDrawerComponent,
    StoreFooterComponent,
  ],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);
  private readonly notifications = inject(EcNotificationsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly mobileDrawerOpen = signal(false);
  readonly isScrolled = signal(false);
  readonly hasAnnouncement =
    LAYOUT_CONFIG.announcement.enabled && LAYOUT_CONFIG.announcement.messages.length > 0;

  readonly isHomeViewport = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.isHomeRoute()),
      startWith(this.isHomeRoute()),
    ),
    { initialValue: this.isHomeRoute() },
  );

  private metricsObserver: ResizeObserver | null = null;

  constructor() {
    effect(() => {
      if (this.isHomeViewport()) {
        this.bindHomeHeroHeight();
      } else {
        this.clearHomeHeroHeight();
      }
    });

    afterNextRender(() => {
      if (this.isHomeViewport()) {
        this.bindHomeHeroHeight();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.metricsObserver?.disconnect();
      this.metricsObserver = null;
      this.clearHomeHeroHeight();
    });
  }

  ngOnInit(): void {
    this.cart.refresh();
    this.wishlist.refresh();
    this.notifications.initializeForAuthenticatedUser();
    this.syncScrollState();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.syncScrollState();
  }

  openMobileDrawer(): void {
    this.mobileDrawerOpen.set(true);
    this.document.body.classList.add('store-drawer-open');
  }

  closeMobileDrawer(): void {
    this.mobileDrawerOpen.set(false);
    this.document.body.classList.remove('store-drawer-open');
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.mobileDrawerOpen()) {
      this.closeMobileDrawer();
    }
  }

  private isHomeRoute(): boolean {
    const path = this.router.url.split('?')[0].replace(/\/+$/, '') || '/';
    return path === '/home' || path === '/';
  }

  private syncScrollState(): void {
    this.isScrolled.set((this.document.defaultView?.scrollY ?? 0) > 8);
  }

  private bindHomeHeroHeight(): void {
    const shell = this.elementRef.nativeElement.querySelector('.store-shell') as HTMLElement | null;
    const announcement = shell?.querySelector('.store-announcement') as HTMLElement | null;
    const chrome = shell?.querySelector('.store-chrome') as HTMLElement | null;

    if (!shell || !chrome) {
      return;
    }

    const update = (): void => {
      const announcementHeight = announcement?.offsetHeight ?? 0;
      const chromeHeight = chrome.offsetHeight;
      const heroHeight = `calc(100svh - ${announcementHeight + chromeHeight}px)`;
      shell.style.setProperty('--store-home-hero-height', heroHeight);
    };

    update();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    this.metricsObserver?.disconnect();
    this.metricsObserver = new ResizeObserver(update);
    this.metricsObserver.observe(chrome);
    if (announcement) {
      this.metricsObserver.observe(announcement);
    }
  }

  private clearHomeHeroHeight(): void {
    const shell = this.elementRef.nativeElement.querySelector('.store-shell') as HTMLElement | null;
    shell?.style.removeProperty('--store-home-hero-height');
    this.metricsObserver?.disconnect();
    this.metricsObserver = null;
  }
}
