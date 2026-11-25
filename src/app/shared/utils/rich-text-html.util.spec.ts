import { describe, expect, it } from 'vitest';

import { richTextToPlain, sanitizeRichTextHtml } from './rich-text-html.util';

const SAMPLE = [
  '<h2>Daily serum</h2>',
  '<p>Light <strong>care</strong> and <em>shine</em>.</p>',
  '<ul><li>Morning</li><li>Night</li></ul>',
  '<p><a href="https://example.com/guide">Guide</a></p>',
  '<script>globalThis.__richTextXss = 1</script>',
  '<img src="x" onerror="globalThis.__richTextXss = 1">',
].join('');

describe('sanitizeRichTextHtml', () => {
  it('keeps safe rich text and drops script, handlers, and unsafe URLs', () => {
    const html = sanitizeRichTextHtml(
      [
        '<h2 onclick="globalThis.__richTextXss = 1">عنوان</h2>',
        '<p>نص <b>عريض</b> و <i>مائل</i> و <u>تحته خط</u></p>',
        '<ol><li>خطوة</li></ol>',
        '<span style="background:url(javascript:alert(1))">ملاحظة</span>',
        '<a href="javascript:alert(1)" onclick="globalThis.__richTextXss = 1">اضغط</a>',
        '<a href="  JaVaScRiPt:alert(1)">also</a>',
        '<a href="data:text/html,hi">data</a>',
        '<a href="//evil.example">proto</a>',
        '<a href="https://example.com/path">رابط</a>',
        '<div><font>داخل</font></div>',
        '<script>globalThis.__richTextXss = 1</script>',
        '<p>بعد<script>globalThis.__richTextXss = 1</script>النص</p>',
      ].join(''),
    );

    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.appendChild(host);

    expect(host.querySelector('h2')?.textContent).toBe('عنوان');
    expect(host.querySelector('b')?.textContent).toBe('عريض');
    expect(host.querySelector('i')?.textContent).toBe('مائل');
    expect(host.querySelector('u')?.textContent).toBe('تحته خط');
    expect(host.querySelector('ol li')?.textContent).toBe('خطوة');
    expect(host.querySelector('span')?.getAttribute('style')).toBeNull();
    expect(host.querySelector('span')?.textContent).toBe('ملاحظة');
    expect(host.querySelector('a')?.getAttribute('href')).toBe('https://example.com/path');
    expect(host.querySelector('a')?.textContent).toBe('رابط');
    expect(host.textContent).toContain('اضغط');
    expect(host.textContent).toContain('داخل');
    expect(host.textContent).toContain('بعدالنص');
    expect(html.toLowerCase()).not.toContain('<script');
    expect(html.toLowerCase()).not.toContain('onerror');
    expect(html.toLowerCase()).not.toContain('onclick');
    expect(html.toLowerCase()).not.toContain('javascript:');
    expect(html.toLowerCase()).not.toContain('<img');
    expect(host.querySelector('script')).toBeNull();
    expect(host.querySelector('img')).toBeNull();
    expect((globalThis as { __richTextXss?: number }).__richTextXss).toBeUndefined();

    host.remove();
  });

  it('renders a formatted description without showing raw tags', () => {
    const html = sanitizeRichTextHtml(SAMPLE);
    const host = document.createElement('div');
    host.innerHTML = html;

    expect(host.querySelector('h2')?.textContent).toBe('Daily serum');
    expect(host.querySelector('strong')?.textContent).toBe('care');
    expect(host.querySelector('em')?.textContent).toBe('shine');
    expect(host.querySelectorAll('li')).toHaveLength(2);
    expect(host.querySelector('a')?.getAttribute('href')).toBe('https://example.com/guide');
    expect(host.textContent).not.toContain('<p>');
    expect(host.textContent).not.toContain('<strong>');
    expect(host.querySelector('script')).toBeNull();
    expect((globalThis as { __richTextXss?: number }).__richTextXss).toBeUndefined();
  });

  it('leaves plain text unchanged', () => {
    expect(sanitizeRichTextHtml('  Light daily serum  ')).toBe('  Light daily serum  ');
    expect(richTextToPlain('<p><br></p>')).toBe('');
    expect(richTextToPlain('<p>Hello&nbsp;<strong>world</strong></p>')).toBe('Hello world');
  });
});
