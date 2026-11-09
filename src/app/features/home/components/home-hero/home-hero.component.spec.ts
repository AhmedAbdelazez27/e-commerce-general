import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { LanguageService } from '../../../../core/services/language.service';
import { APP_ENVIRONMENT } from '../../../../core/tokens/app-environment.token';
import { EcPublicCatalogApiService } from '../../../../layout/services/ec-public-catalog-api.service';
import { HomeHeroComponent } from './home-hero.component';
import { resolveSliderImageUrl } from '../../utils/home-slider.mapper';

describe('home hero image fallback', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeHeroComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: EcPublicCatalogApiService, useValue: { getHomeSliders: () => of([]) } },
        { provide: LanguageService, useValue: { apiCulture: () => 'en', currentLang: () => 'en' } },
        { provide: APP_ENVIRONMENT, useValue: { apiBaseUrl: 'https://example.com' } },
      ],
    }).compileComponents();
  });

  it('keeps a background container without broken images or controls when there are no slides', () => {
    const fixture = TestBed.createComponent(HomeHeroComponent);
    fixture.componentRef.setInput('config', { autoPlay: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.home-hero__slider')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.home-hero__nav')).toBeNull();
  });

  it('removes a failed image while retaining the slide content and link', () => {
    const fixture = TestBed.createComponent(HomeHeroComponent);
    fixture.componentRef.setInput('config', {
      autoPlay: false,
      slides: [
        {
          id: 'one',
          imageSrc: '/missing.jpg',
          headline: 'Shop',
          ctaLabel: 'Browse',
          ctaRoute: '/shop',
        },
      ],
    });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.home-hero__headline').textContent).toContain(
      'Shop',
    );
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/shop');
  });

  it('uses the background for missing URLs and still accepts a mobile image', () => {
    expect(resolveSliderImageUrl(null, ' ', 'https://example.com')).toBe('');
    expect(
      resolveSliderImageUrl(null, 'https://example.com/mobile.jpg', 'https://example.com'),
    ).toBe('https://example.com/mobile.jpg');
  });
});
