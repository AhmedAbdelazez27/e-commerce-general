import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { interval } from 'rxjs';

import { LAYOUT_CONFIG } from '../config/layout.config';
import { AnnouncementMessage } from '../models/layout.model';

@Component({
  selector: 'app-announcement-bar',
  imports: [RouterLink, TranslateModule],
  templateUrl: './announcement-bar.component.html',
})
export class AnnouncementBarComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly config = LAYOUT_CONFIG.announcement;
  readonly activeIndex = signal(0);

  ngOnInit(): void {
    if (!this.config.enabled || this.config.messages.length <= 1) {
      return;
    }

    interval(this.config.rotateIntervalMs)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const next = (this.activeIndex() + 1) % this.config.messages.length;
        this.activeIndex.set(next);
      });
  }

  goToSlide(index: number): void {
    this.activeIndex.set(index);
  }

  activeMessage(): AnnouncementMessage | null {
    const messages = this.config.messages;
    if (!messages.length) {
      return null;
    }
    return messages[this.activeIndex()] ?? messages[0];
  }
}
