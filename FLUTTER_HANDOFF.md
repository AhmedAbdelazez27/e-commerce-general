# مستند تسليم: سلوك صفحة المنتج والفلاتر (Web → Flutter)

المطلوب تطبيق نفس السلوك في تطبيق Flutter بناءً على ما تم تنفيذه في الـ Web Storefront.

---

## 1) APIs Used

Base: `EcPublicCatalog`

| الغرض | Endpoint |
|---|---|
| تفاصيل المنتج | `GetProductDetails?Lang=&ProductId=&CurrencyId=&CurrencyCode=` |
| قائمة الفاريانتس | `GetProductVariants?productId=&lang=&CurrencyId=&CurrencyCode=` |
| صور الفاريانت | `GetVariantImages?productVariantId=` |
| صور المنتج | `GetProductImages?productId=` |
| المواصفات | `GetProductSpecifications?productId=&lang=&productVariantId?` |
| السعر النهائي | `GetFinalPrice?ProductId=&ProductVariantId?&Quantity=&Lang=&CurrencyId=&CurrencyCode=` |
| التوفر | `GetProductAvailability?productId=&productVariantId?` |
| منتجات ذات صلة | `GetRelatedProducts?...` |

**مهم:** لو `GetRelatedProducts` بطيء/معلّق، متخليش شاشة المنتج تفضل Loading للأبد. حط timeout (مثلاً 12 ثانية) وكمل بدون Related.

---

## 2) متى نعرض الفاريانتس؟

مش بس لما المخزون يكون Model.

اعرض الفاريانتس لو أي شرط من دول صحيح:

- `stock.controlType == 2 && stock.lotType == 2` (requiresModel)
- أو `hasVariants == true`
- أو `variants` جاية من `GetProductDetails` وفيها عناصر

طريقة التحميل:

1. نادِ `GetProductVariants`
2. لو فاضي أو مواصفاته أقل من اللي جوه `GetProductDetails.variants`، استخدم/ادمج المواصفات الأغنى من Details

بعد التحميل:

- اختار أول خيار تلقائيًا
- نادِ سعر/صور/توفر الفاريانت المختار

---

## 3) شكل بيانات المواصفات (Specifications)

من الـ API (جدول `EcProductSpecifications`):

| Field | المعنى |
|---|---|
| `isColor` | `true` = القيمة كود لون |
| `textValue` | لو `isColor=true` → hex زي `#198F21`؛ لو `false` → نص عادي |
| `displayValue` | إن وجد يُفضَّل للعرض النصي |
| `numericValue` | للأرقام (مثل الدرجة/Shade) |
| `specificationTypeId` | نوع المواصفة |
| `isFilterable` | لعنوان المجموعة (مثل اللون) |

### قراءة قيمة العرض

الترتيب:

1. `displayValue`
2. `textValue`
3. `boolValue`
4. `numericValue` (+ وحدة إن وجدت)

### كود اللون الصالح

لما `isColor == true`، اقبل فقط:

- `#RGB`
- `#RGBA`
- `#RRGGBB`
- `#RRGGBBAA`

غير كده → اعرضه كنص عادي (حتى لو `isColor=true`).

---

## 4) منطق عرض خيارات الفاريانت (مهم جدًا)

### أ) متقدرش تعمل Dedupe بالـ `specificationTypeId` لوحده للألوان

ممكن فاريانت واحد يبقى عليه أكتر من لون بنفس `specificationTypeId` وقيم hex مختلفة.
لازم تحتفظ بكل لون.

مثال منتج `4787`:

- فاريانت واحد `41640`
- عليه ألوان: `#198F21`, `#821C1C`, `#E81717`

### ب) كل لون = خيار منفصل في الـ UI

لو الفاريانت فيه أكتر من swatch:

- اعرض **دايرة لكل لون**
- الضغط على أي دايرة يختار نفس `productVariantId` + يحفظ اللون المختار في الـ UI state

لو الخيار نص فقط (مقاس/درجة/اسم):

- اعرض زر/Chip نصي عادي

### ج) شكل اللون

- دايرة صغيرة فقط
- `backgroundColor = textValue` (hex)
- من غير مربع/زر بني حوالين الدايرة
- حالة التحديد: حلقة مدوّرة حول الدايرة (ring)، مش خلفية مستطيلة

### د) النص جنب اللون

لو مع اللون مواصفات نصية (مثل Shade `210`):

- ممكن الدايرة + النص
- أما لو ألوان فقط: دايرة بس، والـ hex مش بيتكتب كـ نص على الزر
- `semantics` label يبقى اسم الفاريانت أو اسم + hex للـ accessibility

عنوان المجموعة:

- اسم أول مواصفة `isFilterable` إن وجدت، وإلا أول مواصفة، وإلا ترجمة عامة مثل "الموديل/الخيار"

---

## 5) الصور

عند اختيار فاريانت:

1. نادِ `GetVariantImages(productVariantId)`
2. لو فيه صور صالحة → اعرضها
3. لو فاضي أو العناصر من غير URL صالح → ارجع لصور المنتج الافتراضية (`GetProductImages` / صور Details)

مت تعتمدش على:

- `variant.images` الفاضية جوه Details
- أو `productVariantImageUrl = null`

بعد التبديل: رجّع مؤشر الصورة للصورة الأولى.

---

## 6) السلة (Cart) — سلوك مطلوب + نقطة ناقصة

### المطلوب المطبق حاليًا على الـ Web

عند Add to Cart ابعت:

- `productId`
- `productVariantId` المختار (حتى لو الستوك مش `controlType=2`)
- الكمية
- snapshot: اسم المنتج، `variantName`, `variantSku`, صورة، سعر

Guest cart بيحفظ على الأقل:

- `ProductVariantId`
- `VariantName`
- `VariantSku`

### نقطة مهمة لازم تعرفها قبل Flutter

`selectedColor` (كود اللون المختار) **مش بيتبعت للسلة حاليًا في الـ Web**.

يعني لو 3 ألوان على نفس `productVariantId`:

- اختيار أخضر أو أحمر هيتحفظ كنفس سطر السلة
- اللون المحدد UI-only

**توصية للـ Flutter (ويفضّل نكمّلها في الـ Web كمان):**

احفظ مع عنصر السلة:

- `selectedColor` / `specificationId` / عرض نص المواصفات المختارة

عشان اللون يظهر في السلة والطلب.

---

## 7) قواعد المخزون والشراء

- `requiresModel` = `controlType == 2 && lotType == 2`
- الشراء متاح لو: `available > 0` أو `allowOnlineBackorder == true`
- الحالة:
  - متوفر / Backorder / غير متوفر
- الكمية:
  - لازم > 0
  - لو `controlType == 1` لازم رقم صحيح
- لو المنتج فيه فاريانتس ومفيش اختيار → متعملش Add (أو افتح Picker)

---

## 8) فلاتر الكتالوج (Catalog Filters Scroll)

في شاشة المتجر/القائمة:

- سايدبار الفلاتر sticky
- ارتفاع محدود بارتفاع الشاشة تحت الهيدر
- محتوى الفلاتر يتعمل له scroll داخلي
- زر Clear يفضل ظاهر تحت منطقة السكرول
- سكرول الفلاتر متخليش شبكة المنتجات تتحرك معاه

على الموبايل: Drawer فيه body قابل للتمرير أصلًا.

---

## 9) سيناريوهات اختبار مطلوبة

1. منتج فيه فاريانتس و`controlType=0` ومع ذلك الفاريانتس تظهر
2. منتج ألوان متعددة على نفس الفاريانت → كل الألوان دواير منفصلة
3. `isColor=false` → نص عادي مش دايرة
4. hex غير صالح مع `isColor=true` → نص
5. فاريانت من غير صور → يرجع لصور المنتج
6. اختيار فاريانت يحدّث السعر/الاسم/SKU/التوفر
7. Add to Cart يحفظ `productVariantId`
8. (مستحسن) اللون المختار يظهر في السلة لو اتفقتوا تخزنوه
9. Related products لو علّق → المنتج يفتح عادي بعد timeout
10. فلاتر طويلة تتمرر داخليًا بدون ما الصفحة تتكسر

---

## 10) أمثلة بيانات

### مثال 1: لون + درجة (نصي/رقمي)

- Color text: `RED` أو hex
- Shade: `210` أو `"209"` في `textValue`

عرض مقترح:

- لو لون hex: دايرة + `210`
- لو لون نص: `RED · 210`

### مثال 2: منتج `4787`

عدة مواصفات لون `isColor=true` على نفس الفاريانت:

`#198F21`, `#821C1C`, `#E81717`

→ 3 دواير اختيار.

---

## 11) ملخص سريع لمطوّر Flutter

1. حمّل Details + Variants وادمج المواصفات الأغنى
2. افرد كل لون كخيار مستقل
3. الألوان = Circles فقط
4. النص/المقاس = Chips/Buttons عادية
5. الصور: Variant → fallback Product
6. السلة: لازم `productVariantId`
7. لو عايزين اللون يظهر في السلة: خزّنوا كود اللون مع الـ cart item
8. فلاتر: internal scroll
9. Related: timeout حتى لا تعلق الشاشة

---

## 12) مراجع التنفيذ في الـ Web (للمقارنة)

| الموضوع | مكان تقريبي في الريبو |
|---|---|
| تحميل المنتج والفاريانتس | `src/app/features/catalog/services/product-detail.service.ts` |
| ماب المواصفات والألوان | `src/app/features/catalog/utils/product-detail-api.mapper.ts` |
| تفريد خيارات اللون | `src/app/features/catalog/utils/product-detail.util.ts` |
| UI صفحة المنتج | `src/app/features/catalog/pages/product-detail-page/` |
| ستايل الدواير | `src/styles/catalog/_product-detail.scss` |
| إضافة السلة | `src/app/core/services/cart-actions.service.ts` |
| سكرول الفلاتر | `src/styles/catalog/_catalog-listing.scss` + `catalog-page.component.html` |
| قواعد المخزون | `src/app/shared/utils/product-stock.util.ts` |
