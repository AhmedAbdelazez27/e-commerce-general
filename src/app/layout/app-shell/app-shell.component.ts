import { DOCUMENT } from '@angular/common';
import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { CartService } from '../../core/services/cart.service';
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

  readonly mobileDrawerOpen = signal(false);
  readonly hasAnnouncement =
    LAYOUT_CONFIG.announcement.enabled && LAYOUT_CONFIG.announcement.messages.length > 0;

  ngOnInit(): void {
    this.cart.refresh();
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
}
