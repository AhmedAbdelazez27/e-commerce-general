# Flutter Handoff: Color Swatches (الألوان والدواير)

مستند مخصص **فقط** لجزئية الألوان اللي اتنفذت في الـ Web خلال الشات، عشان تتطبق بنفس الطريقة في Flutter.

---

## الهدف

لما مواصفة الفاريانت تكون لون:

- `isColor = true`
- `textValue` = كود hex زي `#198F21`

اعرضها كـ **دايرة صغيرة** خلفية لونها هو الكود.

لما `isColor = false`:
- اعرض `textValue` كنص عادي (زي `RED` أو `Black`).

---

## مصدر البيانات

الـ API: `GetProductDetails` / `GetProductVariants`

كل فاريانت فيه `specifications[]`، والمواصفة شكلها تقريبًا:

```json
{
  "id": 88,
  "productVariantId": 41640,
  "specificationTypeId": 9,
  "specificationName": "اللون",
  "specificationNameAr": "اللون",
  "specificationNameEn": "Color",
  "code": "#color",
  "dataType": "Text",
  "textValue": "#198F21",
  "isColor": true,
  "isVisible": true,
  "displayValue": null,
  "isFilterable": false
}
```

من الداتابيز (`EcProductSpecifications`):

| Field | الاستخدام |
|---|---|
| `IsColor` | لو `true` اعتبر `TextValue` كود لون |
| `TextValue` | hex لما يكون لون، أو نص عادي لما مش لون |
| `DisplayValue` | للعرض النصي إن وجد |
| `SpecificationTypeId` | نوع المواصفة (اللون ممكن يتكرر أكتر من مرة) |

---

## قواعد التحويل (Mapping)

### 1) قراءة `isColor`

ادعم camelCase و PascalCase:

- `isColor` / `IsColor`

### 2) استخراج كود اللون

لو `isColor != true` → مفيش swatch.

لو `isColor == true`، خد `textValue` واقبله فقط لو مطابق:

- `#RGB`
- `#RGBA`
- `#RRGGBB`
- `#RRGGBBAA`

مثال صالح: `#198F21`, `#0001`, `#C45C26`  
مثال غير صالح مع `isColor=true`: `RED` → اتعرضه كنص مش دايرة.

### 3) متتعملش Dedupe بالـ type لوحده

غلط: تمسح الألوان الزيادة لأن ليهم نفس `specificationTypeId`.

صح: احتفظ بكل لون مختلف (بالـ hex أو بـ `id`).

مثال منتج `4787` / فاريانت `41640`:

- `#198F21`
- `#821C1C`
- `#E81717`

الثلاثة لازم تظهر.

---

## شكل الـ UI المطلوب

### عنوان المجموعة

تحت ليبل زي **اللون** / `Color`  
(من اسم المواصفة، أو أول مواصفة filterable إن وجدت)

### كل لون = خيار منفصل

حتى لو كل الألوان على **نفس** `productVariantId`:

- اعرض دايرة مستقلة لكل hex
- الضغط على دايرة = تحديد اللون ده في الـ UI
- لسه `productVariantId` هو بتاع نفس الفاريانت

### ستايل الدايرة

- شكل دائري فقط (`borderRadius` كامل)
- الحجم تقريبًا 24px
- `backgroundColor = hex`
- بوردر خفيف عشان الأبيض يبان
- **من غير** مربع/زر بني حوالين الدايرة
- حالة التحديد: ring دائري حول الدايرة (مش خلفية مستطيلة)

### Accessibility

خلي `semantics` / label للدايرة يشمل اسم الفاريانت أو اللون، مثال:

- `test (#821C1C)`

الكود نفسه مش لازم يتكتب كـ نص ظاهر جنب الدايرة لو الخيار لون فقط.

---

## سلوك الاختيار

عند الضغط على دايرة:

1. حدّد `productVariantId` بتاع الفاريانت
2. خزّن `selectedColor = textValue` في state الشاشة
3. حدّث السعر/الصور/التوفر لو محتاج (حسب فاريانت)
4. أول ما الصفحة تفتح: اختار أول لون تلقائيًا

### ملاحظة سلة مهمة

في الـ Web الحالي:

- `productVariantId` بيتبعت ويتسجل في السلة
- `selectedColor` **مش** بيتبعت مع السلة

يعني لو 3 ألوان على نفس الفاريانت، السلة مش هتفرّق بينهم إلا لو خزنتوا اللون صراحة.

**مستحسن في Flutter:** احفظ مع عنصر السلة كمان:

- `selectedColor` (hex)
- واختياريًا `specificationId`

عشان اللون المختار يظهر في السلة والطلب.

---

## أمثلة عرض

| الحالة | العرض |
|---|---|
| `isColor=true`, `textValue=#198F21` | دايرة خضراء |
| 3 ألوان على فاريانت واحد | 3 دواير |
| `isColor=false`, `textValue=RED` | نص `RED` |
| لون hex + درجة `210` | دايرة + نص `210` |
| `isColor=true` لكن `textValue=RED` | نص `RED` (مش دايرة) |

---

## Checklist للـ Flutter

- [ ] قراءة `isColor` / `IsColor` من الـ API
- [ ] استخراج hex صالح من `textValue` فقط
- [ ] الإبقاء على كل الألوان حتى لو نفس `specificationTypeId`
- [ ] كل لون = دايرة منفصلة
- [ ] مفيش مربع بني حول الدايرة
- [ ] selected state = ring دائري
- [ ] اختيار أول لون تلقائي عند فتح المنتج
- [ ] (مستحسن) حفظ `selectedColor` مع عنصر السلة

---

## مرجع التنفيذ في الـ Web

| الموضوع | الملف |
|---|---|
| استخراج اللون | `src/app/features/catalog/utils/product-detail-api.mapper.ts` → `resolveSpecificationColor` |
| تفريد الدواير كخيارات | `src/app/features/catalog/utils/product-detail.util.ts` → `variantPickerOptions` |
| UI صفحة المنتج | `src/app/features/catalog/pages/product-detail-page/` |
| ستايل الدواير | `src/styles/catalog/_product-detail.scss` |
| موديل المواصفة | `ProductDetailSpec.color` / `isColor` |

للسلوك العام (فاريانتس/صور/فلاتر) راجع: `FLUTTER_HANDOFF.md`
