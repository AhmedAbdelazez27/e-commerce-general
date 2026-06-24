# حالة تنفيذ Portal Theme / CSS Variables

> **وثيقة handoff داخلية** — آخر تحديث: 2025-06-23  
> للمطورين وجلسات AI القادمة. لا تعدّل ملف الخطة في `.cursor/plans`.

---

## 1. التقييم النهائي

**التقييم العام: 6/10 — أساس معماري جيد، تنفيذ CSS غير مكتمل.**

البنية المنفصلة (`portal-config/` للبيانات، `portal-theme/` للثيم) قرار صحيح وقابل للتوسع. مسار التحميل عبر `APP_INITIALIZER` يضمن حقن المتغيرات قبل عرض التطبيق عند نجاح الـ API. تعريف `--portal-*` في `_tokens.scss` يوفّر عقداً واضحاً بين الباك إند وملفات SCSS.

**ما هو جاهز للإنتاج (جزئياً):**

- تحميل `GetPortalConfiguration` ودمجه مع الافتراضيات (`PortalConfigService`).
- حقن قيم الثيم على `:root` عند نجاح الـ API (`PortalThemeService` → `applyPortalThemeToDocument`).
- اللوجو، السوشيال، والتواصل من الـ API (منفصلة عن طبقة الثيم).
- قيم افتراضية في `_tokens.scss` تسمح بتشغيل الواجهة بدون API.
- أمثلة عملية لربط SCSS بـ `var(--portal-*)` (مثل `.gold`، ألوان الـ nav في `_store-layout.scss`).

**ما ليس جاهزاً للإنتاج:**

- عشرات الاستخدامات لمتغيرات `--portal-*` **غير معرّفة** (`--portal-text-muted`، `--portal-text-on-primary`، إلخ).
- مسار فشل الـ API لا يطبّق الثيم الافتراضي عبر `portalTheme.apply()`.
- نظامان متوازيان للثيم (`--store-*` من JSON و`--portal-*` من API) بدون توحيد.
- تعارض أنماط الفوتر بين `_store-layout.scss` و`styles.scss`.
- `faviconUrl` من الـ API غير موصول (الدالة موجودة لكن لا تُستدعى).
- دليل المصمم PDF/HTML قديم ولا يطابق `_tokens.scss`.
- خطأ مطبعي متبقٍ في `styles.scss` (مُصلَح في `styles.rtl.scss`).

**الرأي الصريح:** لا تعتمد على أن «تغيير لون من لوحة التحكم يغيّر كل الواجهة» — حتى الآن التأثير محدود بالعناصر التي تستخدم `var(--portal-*)` صراحةً أو عبر جسر `ds-*` الجزئي.

---

## 2. ما تم إنجازه (Done)

### المرحلة 1: تعريف `--portal-*` + الحقن وقت التشغيل

**الملف:** `src/styles/design-system/_tokens.scss`

تعريف المتغيرات الأساسية على `:root`:

| متغير CSS | القيمة الافتراضية في SCSS |
|-----------|---------------------------|
| `--portal-primary` | `#114d7d` |
| `--portal-secondary` | `#4e5f7c` |
| `--portal-accent` | `#1b6fec` |
| `--portal-success` | `#20965f` |
| `--portal-danger` | `#ff8f9c` |
| `--portal-warning` | `#f3bc16` |
| `--portal-background` | `#f9f9f7` |
| `--portal-text` | `#1a1a1a` |
| `--portal-header-bg` | `#ffffff` |
| `--portal-footer-bg` | `#f9f9f7` |
| `--portal-body-bg` | `#f9f9f7` |
| `--portal-radius` | `0.25rem` |
| `--portal-font-family-ar` / `-en` | Manrope + fallbacks |
| `--portal-font-family` | `var(--portal-font-family-en)` |
| `--portal-font-size-base` | `16px` |
| `--portal-font-size-heading` | `30px` |
| `--portal-font-size-small` | `14px` |

**سلسلة الحقن (TypeScript):**

```
GetPortalConfiguration
  → PortalConfigService.load()
  → mergePortalConfig + normalizePortalConfigurationDto
  → PortalThemeService.apply(config)
  → mapPortalConfigurationToTheme()
  → applyPortalThemeToDocument()  // يكتب على document.documentElement
```

**الملفات:**

- `src/app/core/portal-theme/portal-theme.model.ts` — واجهة التوكنز
- `src/app/core/portal-theme/portal-theme.mapper.ts` — تحويل `PortalConfiguration` → `PortalThemeTokens`
- `src/app/core/portal-theme/portal-theme-applier.ts` — `setProperty` على `:root`
- `src/app/core/portal-theme/portal-theme.service.ts` — تنسيق + تحديث الفونت عند تغيير اللغة

**التسجيل:** `src/app/app.config.ts` — `APP_INITIALIZER` عبر `initPortalConfigFactory`.

### اللوجو / السوشيال / التواصل (منفصلة عن الثيم)

`PortalConfigService` (`src/app/core/portal-config/portal-config.service.ts`) يتولى:

- `logoSrc()` / `mobileLogoSrc()` من `logoUrl` / `mobileLogoUrl`
- `socialLinks` من `socialMedia`
- `contactInfo`، `chatSupportHref`، `enableChatSupport`
- `portalName(lang)` من `portalNameAr` / `portalNameEn`

هذه الحقول **لا تُحقَن كـ CSS variables** — تُستهلك في القوالب والمكوّنات مباشرة.

### الخطوة 2 (جزئية): ربط `ds-*` بـ `portal-*`

في `_tokens.scss`، بعض توكنز التصميم مربوطة:

```scss
--ds-color-primary: var(--portal-primary, #114d7d);
--ds-color-secondary: var(--portal-secondary, #4e5f7c);
--ds-color-accent: var(--portal-accent, #1b6fec);
--ds-color-success: var(--portal-success, #20965f);
--ds-color-danger: var(--portal-danger, #ff8f9c);
--ds-color-warning: var(--portal-warning, #ffc107);
--ds-color-text-link: var(--portal-primary);
--ds-color-background-inverse: var(--portal-primary);
--ds-color-border-focus: var(--portal-primary);
--portal-primary-soft: var(--portal-secondary);
```

**لم يُربط بعد:** `--ds-color-text`، `--ds-font-family`، `--ds-radius-base`، `--ds-color-background` (ما زالت تعتمد `--store-*` أو قيماً ثابتة).

### أمثلة استخدام في SCSS

**`.gold`** — `src/styles.scss` (سطر ~74):

```scss
.gold {
    color: var(--portal-primary);
}
```

يُستخدم كلاس `.gold` في الناف والبروفايل والأوردرات؛ عند نجاح الـ API يأخذ `primaryColor` من الباك.

**ألوان الـ nav** — `src/styles/layout/_store-layout.scss`:

- `--portal-header-bg` لخلفية الهيدر
- `--portal-text` / `--portal-text-muted` للنصوص
- `--portal-primary` للأزرار والـ hover والحدود
- `--portal-primary-soft` لشريط الإعلانات
- `--portal-text-on-primary` لنص على خلفية primary

**ملاحظة:** `styles.scss` يحتوي عشرات المراجع لـ `--portal-*` (فوتر، بطاقات، فورمات، إلخ) — لكن ليس كل الملفات الفرعية في `src/styles/` محدّثة بنفس الدرجة.

### دليل PDF للمصمم

- `docs/portal-css-variables-guide.html` — مصدر الطباعة
- `docs/portal-css-variables-guide.pdf` — النسخة المسلّمة للمصمم

**تحذير:** القيم الافتراضية في الدليل قديمة (مثل `#775a19`، `#d24858`) ولا تطابق `_tokens.scss` الحالي — انظر القسم 4.

---

## 3. الـ API الفعلي (قيم مرجعية من الباك إند)

**Endpoint:**

```
GET http://compassint.ddns.net:2029/api/services/app/EcPublicSettings/GetPortalConfiguration
```

**آخر response حقيقي قدّمه المستخدم** (داخل `result`):

| حقل API | القيمة الفعلية |
|---------|----------------|
| `portalNameAr` | الموقع الاكتروني |
| `portalNameEn` | Website |
| `primaryColor` | `#114d7d` |
| `secondaryColor` | `#e6e6e6` |
| `accentColor` | `#2f3130` |
| `backgroundColor` | `#ffffff` |
| `textColor` | `#2f3130` |
| `headerColor` | `#ffffff` |
| `footerColor` | `#ededed` |
| `fontFamilyAr` | `Cairo` |
| `fontFamilyEn` | `Roboto` |
| `fontSizeBase` | `14` |
| `fontSizeHeading` | `24` |
| `fontSizeSmall` | `12` |
| `faviconUrl` | `null` |
| `logoUrl` / `darkLogoUrl` / `mobileLogoUrl` | URLs على `compassint.ddns.net:2042` |

### جدول التحويل الكامل: حقل API → متغير CSS

| حقل API | متغير CSS | ملاحظة الحقن |
|---------|-----------|---------------|
| `primaryColor` | `--portal-primary` | `applyPortalThemeToDocument` |
| `secondaryColor` | `--portal-secondary` |同上 |
| `accentColor` | `--portal-accent` |同上 |
| `backgroundColor` | `--portal-background` |同上 |
| `textColor` | `--portal-text` |同上 |
| `headerColor` | `--portal-header-bg` |同上 |
| `footerColor` | `--portal-footer-bg` |同上 |
| `fontFamilyAr` | `--portal-font-family-ar` |同上 |
| `fontFamilyEn` | `--portal-font-family-en` |同上 |
| — (مشتق) | `--portal-font-family` | عربي → Ar، إنجليزي → En |
| `fontSizeBase` | `--portal-font-size-base` | يُحوَّل إلى `14px` |
| `fontSizeHeading` | `--portal-font-size-heading` | يُحوَّل إلى `24px` |
| `fontSizeSmall` | `--portal-font-size-small` | يُحوَّل إلى `12px` |
| — | `--portal-success` | **لا يأتي من API** — من `DEFAULT_STOREFRONT_CONFIG` |
| — | `--portal-danger` | **لا يأتي من API** |
| — | `--portal-warning` | **لا يأتي من API** |
| — | `--portal-radius` | **لا يأتي من API** — من `storefrontTheme.borderRadius` (`0.25rem`) |
| — | `--portal-body-bg` | **معرّف في SCSS فقط** — لا يُحدَّث في `applier` |
| `faviconUrl` | — (DOM `<link rel="icon">`) | **غير موصول** — `applyPortalFavicon` موجودة لكن غير مستدعاة |
| `logoUrl` وغيرها | — | HTML/TS عبر `PortalConfigService`، ليست CSS vars |

**حقول الـ API خارج نطاق CSS:** `portalName*`، `portalDescription*`، `logoUrl`، `contactInfo`، `socialMedia`، `seo`، `show*`، `mobileSettings`، `splashScreenImageUrl`.

---

## 4. المشاكل المعروفة (Known issues) — حسب الأولوية

### P1 — متغيرات `--portal-*` مشتقة مفقودة (مستخدمة بكثرة، غير معرّفة)

`_tokens.scss` **لا يعرّف**:

| المتغير المفقود | أماكن الاستخدام (أمثلة) |
|-----------------|-------------------------|
| `--portal-text-muted` | `_store-layout.scss`، `_home-page.scss`، `_product-detail.scss`، `product-card.component.scss`، `_utilities.scss`، `_bootstrap-bridge.scss`، `_brands-page.scss`، `_wishlist-page.scss` |
| `--portal-text-on-primary` | `_store-layout.scss`، `_home-page.scss`، `product-card.component.scss`، `_bootstrap-bridge.scss` |
| `--portal-text-on-accent` | `_store-layout.scss`، `_home-page.scss`، `product-card.component.scss`، `_utilities.scss`، `_bootstrap-bridge.scss` |
| `--portal-text-secondary` | `_store-layout.scss`، `_home-page.scss`، `_brands-page.scss`، `_product-detail.scss`، `_bootstrap-bridge.scss` |

**المعرّف الوحيد المشتق حالياً:** `--portal-primary-soft: var(--portal-secondary)` في `_tokens.scss`.

**الأثر:** المتصفح يتجاهل `var(--portal-text-muted)` فيصبح النص بلون الوراثة أو شفافاً حسب السياق.

### P1 — مسار فشل الـ API لا يستدعي `portalTheme.apply()`

في `portal-config.service.ts`:

```typescript
// عند النجاح فقط:
this.portalTheme.apply(this.configSignal());

// عند remote === null أو catch:
this.loadErrorSignal.set(true);
// لا يوجد portalTheme.apply(DEFAULT_PORTAL_CONFIG)
```

**الأثر:** عند فشل الشبكة يبقى `:root` على قيم `_tokens.scss` الثابتة فقط (بدون دمج `DEFAULT_PORTAL_CONFIG`)، ولا يُحدَّث `--portal-font-family` حسب اللغة.

### P2 — `--portal-body-bg` غير متزامن في `applier`

معرّف في `_tokens.scss` كـ `#f9f9f7` لكن `applyPortalThemeToDocument` لا يكتب `--portal-body-bg` — أي كود يعتمد عليه لن يتبع `backgroundColor` من API.

### P2 — نظاما ثيم مزدوجان: `--store-*` مقابل `--portal-*`

| المصدر | المتغيرات | الخدمة | الملف |
|--------|-----------|--------|-------|
| `public/config/storefront.config.json` | `--store-primary`، `--store-background`، `--bs-*` | `StorefrontConfigService` | يُحمَّل داخلياً من `PortalConfigService.load()` |
| `GetPortalConfiguration` | `--portal-*` | `PortalThemeService` | عند نجاح API فقط |

`storefront.config.json` الحالي يشير ألوانه إلى `var(--portal-primary)` إلخ — جسر غير مباشر. لكن:

- `--ds-color-background` → `var(--store-background)` وليس `--portal-background`
- `--ds-font-family` → `var(--store-font-family)` وليس `--portal-font-family`
- `--ds-radius-base` → `var(--store-radius)` وليس `--portal-radius`

`initStorefrontConfigFactory` **غير مسجّل** في `app.config.ts` — التحميل يتم فقط عبر `PortalConfigService`.

### P2 — تعارض أنماط الفوتر

| الملف | `.store-footer` background |
|-------|---------------------------|
| `src/styles/layout/_store-layout.scss` | `var(--portal-primary)` |
| `src/styles.scss` | `var(--portal-footer-bg)` |

نفس الكلاس بقواعد متعارضة — النتيجة تعتمد على ترتيب تحميل/خصوصية CSS. الـ API يوفّر `footerColor: #ededed` لـ `--portal-footer-bg` لكن `_store-layout.scss` يتجاهله ويستخدم primary.

### P3 — `favicon` غير موصول

- `applyPortalFavicon()` في `portal-theme-applier.ts` جاهزة
- `faviconUrl` يُمرَّر في `mapPortalConfigurationToTheme`
- **لا استدعاء** من `PortalThemeService` أو `PortalConfigService`
- الـ API يرجع `faviconUrl: null` حالياً

### P3 — دليل المصمم PDF/HTML غير متزامن

`docs/portal-css-variables-guide.html` يعرض defaults قديمة:

| متغير | في الدليل | في `_tokens.scss` الفعلي |
|-------|-----------|--------------------------|
| `--portal-primary` | `#775a19` | `#114d7d` |
| `--portal-accent` | `#d24858` | `#1b6fec` |
| `--portal-success` | `#198754` | `#20965f` |
| `--portal-danger` | `#d24858` | `#ff8f9c` |
| `--portal-footer-bg` | `#775a19` | `#f9f9f7` |

أمثلة «من الباك» في الدليل من response أقدم (`#b1d822`، إلخ) وليست آخر قيم (`#114d7d`).

### P3 — خطأ مطبعي في `styles.scss` (مُصلَح في RTL)

`src/styles.scss` سطر ~106:

```scss
color: var(--portal-text)000 !important;  /* خطأ */
```

`src/styles.rtl.scss` المقابل:

```scss
color: var(--portal-text) !important;  /* صحيح */
```

**إجراء مطلوب:** إصلاح النسخة LTR (`styles.scss`) بنفس التصحيح.

### P4 — ألوان ثابتة متبقية في `styles.scss`

رغم كثرة `var(--portal-*)`، الملف ما زال كبيراً ويحتوي أنماط legacy (فوتر، بطاقات، فورمات) لم تُراجع كلها. الهدف طويل المدى: استبدال تدريجي وليس دفعة واحدة.

---

## 5. الخطوات التالية (Next steps) — مرتبة حسب الأولوية

1. **تعريف متغيرات النص المشتقة في `_tokens.scss`**
   - `--portal-text-muted` (مثلاً `color-mix` من `--portal-text`)
   - `--portal-text-secondary`
   - `--portal-text-on-primary` → `#ffffff` أو مشتق
   - `--portal-text-on-accent` → `#ffffff` أو مشتق
   - مزامنة `--portal-body-bg` مع `--portal-background`

2. **إكمال جسر `ds-*` → `portal-*`**
   - `--ds-color-text` → `var(--portal-text)`
   - `--ds-color-text-muted` → `var(--portal-text-muted)`
   - `--ds-font-family` → `var(--portal-font-family)`
   - `--ds-color-background` → `var(--portal-background)`
   - `--ds-radius-base` → `var(--portal-radius)`

3. **استدعاء `portalTheme.apply()` عند فشل API**
   - في `catch` و`remote === null`: `this.portalTheme.apply(DEFAULT_PORTAL_CONFIG)` أو `mergePortalConfig` ثم apply

4. **توحيد الفوتر على `--portal-footer-bg`**
   - تعديل `_store-layout.scss` ليطابق `styles.scss` وقيمة `footerColor` من API
   - إزالة التعارض بين الملفين

5. **ربط favicon**
   - استدعاء `applyPortalFavicon(tokens.faviconUrl)` من `PortalThemeService.applyTokens()`

6. **مزامنة دليل المصمم**
   - تحديث `docs/portal-css-variables-guide.html` من `_tokens.scss` + آخر API
   - إعادة توليد PDF

7. **استبدال الألوان الثابتة في `styles.scss` تدريجياً**
   - إصلاح typo `portal-text)000`
   - مراجعة أقسام الفوتر والبطاقات

---

## 6. ملفات مهمة (Key files map)

| المسار | الدور |
|--------|-------|
| `src/styles/design-system/_tokens.scss` | تعريف `--portal-*` و`--ds-*` الافتراضية |
| `src/app/core/portal-theme/portal-theme-applier.ts` | حقن CSS على `:root` |
| `src/app/core/portal-theme/portal-theme.mapper.ts` | API config → theme tokens |
| `src/app/core/portal-theme/portal-theme.service.ts` | تنسيق الثيم + تغيير الفونت باللغة |
| `src/app/core/portal-config/portal-config.service.ts` | تحميل API، لوجو، سوشيال، استدعاء الثيم |
| `src/app/core/portal-config/default-portal-config.ts` | افتراضيات Portal كاملة |
| `src/app/core/portal-config/portal-configuration.model.ts` | واجهة الـ config |
| `src/app/core/storefront-config/storefront-config.service.ts` | `--store-*` وBootstrap vars من JSON |
| `public/config/storefront.config.json` | override محلي (legacy overlap) |
| `src/styles/layout/_store-layout.scss` | shell: header، nav، drawer، footer |
| `src/styles.scss` | أنماط legacy واسعة + `.gold` |
| `src/styles.rtl.scss` | مرآة RTL (typo مُصلَح هنا) |
| `src/app/app.config.ts` | `APP_INITIALIZER` للـ portal config |
| `docs/portal-css-variables-guide.html` | مرجع المصمم (يحتاج تحديث) |
| `docs/portal-css-variables-guide.pdf` | نسخة PDF للتسليم |
| `docs/portal-theme-implementation-status.md` | **هذا الملف** |

---

## 7. قواعد للمصمم / المطور

### للمصمم (CSS/SCSS)

1. استخدم **`var(--portal-*)`** وليس hex ثابت للألوان القابلة للتخصيص من البوابة.
2. الألوان الوظيفية الثابتة (نجاح/خطر/تحذير) من `--portal-success` / `--portal-danger` / `--portal-warning` — ليست من حقول API منفصلة حالياً.
3. للفونت النشط: `var(--portal-font-family)` (يتغير تلقائياً مع اللغة).
4. للخلفيات: `--portal-background`، `--portal-header-bg`، `--portal-footer-bg`.
5. لا تعدّل TypeScript — القيم تُحقَن على `:root` عند التشغيل.

### للمطور (TypeScript / Angular)

1. **مصدر الحقيقة للبراند من الباك:** `GetPortalConfiguration` عبر `PortalConfigService`.
2. **`storefront.config.json`** طبقة legacy/fallback — ألوانه تشير إلى `var(--portal-*)` لكنه يكتب `--store-*` و`--bs-*` بشكل منفصل.
3. أي حقل ثيم جديد من API: أضفه في `PortalConfiguration` → `portal-theme.mapper` → `portal-theme-applier` → `_tokens.scss` → دليل المصمم.
4. فصل واضح: محتوى/سلوك في `portal-config`، ألوان/CSS في `portal-theme`.
5. عند إضافة متغير CSS جديد، **عرّفه في `_tokens.scss` أولاً** قبل استخدامه في SCSS.

### تدفق التحميل (مختصر)

```
APP_INITIALIZER
  → PortalConfigService.load()
      → StorefrontConfigService.load()     // --store-*, --bs-*
      → API GetPortalConfiguration
          [نجاح] → portalTheme.apply()     // --portal-*
          [فشل]  → لا apply (مشكلة معروفة)
```

---

## 8. أوامر التحقق

### بناء المشروع

```bash
npm run build
```

يجب أن ينجح بدون أخطاء TypeScript/SCSS. فشل البناء لا يعني بالضرورة أن الثيم مطبّق بصرياً — تحقق يدوياً أدناه.

### فحص المتغيرات في DevTools

1. شغّل التطبيق (`ng serve` أو بعد build).
2. افتح DevTools → Elements → `<html>` أو `:root`.
3. في **Computed** أو **Styles** ابحث عن:

```
--portal-primary
--portal-secondary
--portal-accent
--portal-background
--portal-text
--portal-header-bg
--portal-footer-bg
--portal-font-family
```

4. **عند نجاح API** يجب أن تطابق قيم الباك (مثلاً `--portal-primary: #114d7d`).
5. **اختبار `.gold`:** عنصر بكلاس `gold` يجب أن يأخذ لون primary من API.
6. **اختبار الفشل:** عطّل الشبكة وأعد التحميل — تحقق أن القيم الافتراضية من `_tokens.scss` ظاهرة (ومن المشاكل المعروفة أن `portalTheme.apply` لن يُستدعى).

### فحص سريع من Console

```javascript
getComputedStyle(document.documentElement).getPropertyValue('--portal-primary').trim()
```

---

## ملحق: مقارنة defaults SCSS vs آخر API

| Token | `_tokens.scss` default | آخر API |
|-------|------------------------|---------|
| primary | `#114d7d` | `#114d7d` ✓ |
| secondary | `#4e5f7c` | `#e6e6e6` |
| accent | `#1b6fec` | `#2f3130` |
| background | `#f9f9f7` | `#ffffff` |
| text | `#1a1a1a` | `#2f3130` |
| footer | `#f9f9f7` | `#ededed` |
| fontSizeBase | `16px` | `14px` |

عند نجاح API تُستبدل قيم `:root` بقيم الباك؛ الافتراضيات في SCSS تظهر فقط قبل الحقن أو عند فشل التحميل.
