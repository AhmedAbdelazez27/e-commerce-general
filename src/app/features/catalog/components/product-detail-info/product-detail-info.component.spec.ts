import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { PortalConfigService } from '../../../../core/portal-config/portal-config.service';
import { AppLang, LanguageService } from '../../../../core/services/language.service';
import { mapPublicProductDetailsToProductDetail } from '../../utils/product-detail-api.mapper';
import { ProductDetailInfoComponent } from './product-detail-info.component';

describe('ProductDetailInfoComponent descriptions', () => {
  const lang = signal<AppLang>('en');

  beforeEach(async () => {
    lang.set('en');
    await TestBed.configureTestingModule({
      imports: [ProductDetailInfoComponent, TranslateModule.forRoot()],
      providers: [
        { provide: LanguageService, useValue: { currentLang: lang } },
        { provide: PortalConfigService, useValue: { enableReturns: () => false } },
      ],
    }).compileComponents();
  });

  function render(descriptionEn: string, descriptionAr = '') {
    const fixture = TestBed.createComponent(ProductDetailInfoComponent);
    fixture.componentRef.setInput('product', mapPublicProductDetailsToProductDetail({
      id: 509,
      name: 'Daily serum',
      categoryId: 5,
      descriptionEn,
      descriptionAr,
    }));
    fixture.detectChanges();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  it('renders stored rich text in desktop and mobile descriptions and follows the language', () => {
    const { fixture, host } = render(
      '<p><strong>Daily serum</strong></p><ul><li>Apply gently.</li></ul>',
      '<p><em>سيروم يومي</em></p>',
    );

    expect(host.querySelector('.product-detail-info__panels strong')?.textContent).toBe('Daily serum');
    expect(host.querySelector('.product-detail-info__accordion li')?.textContent).toBe('Apply gently.');
    lang.set('ar');
    fixture.detectChanges();
    expect(host.querySelectorAll('.product-detail-info__rich-text em')).toHaveLength(2);
    expect(host.querySelector('em')?.textContent).toBe('سيروم يومي');
  });

  it('keeps the collapsed preview readable and restores the full markup when expanded', () => {
    const text = 'Use a small amount daily. '.repeat(16);
    const { fixture, host } = render('<p>Soft &amp; smooth.</p><p><strong>' + text + '</strong></p>');
    const panel = host.querySelector<HTMLElement>('.product-detail-info__panels')!;

    expect(panel.querySelector('.product-detail-info__text')?.textContent).toContain('Soft & smooth. Use');
    expect(panel.querySelector('.product-detail-info__rich-text')).toBeNull();

    panel.querySelector<HTMLButtonElement>('.product-detail-info__more')!.click();
    fixture.detectChanges();
    expect(panel.querySelector('strong')?.textContent).toBe(text);
  });

  it('filters executable markup while keeping safe formatting', () => {
    const { host } = render(
      '<p onclick="unsafeMarker()"><strong>Details</strong></p>' +
      '<script>unsafe marker</script><a href="javascript:unsafeMarker()">See notes</a>',
    );

    const description = host.querySelector('.product-detail-info__rich-text')!;
    expect(description.querySelector('strong')?.textContent).toBe('Details');
    expect(description.querySelector('script, [onclick]')).toBeNull();
    expect(description.textContent).not.toContain('unsafe marker');
    expect(description.querySelector('a')?.getAttribute('href')).not.toMatch(/^javascript:/i);
  });

  it('preserves legacy plain text and treats empty editor markup like an empty description', () => {
    const plain = render('Use < 2 ml.');
    expect(plain.host.querySelector('.product-detail-info__text')?.textContent).toBe('Use < 2 ml.');

    const empty = render('<p><br></p>');
    expect(empty.host.querySelector('.product-detail-info__text--muted')).toBeTruthy();
    expect(empty.host.querySelector('.product-detail-info__rich-text')).toBeNull();
  });
});
