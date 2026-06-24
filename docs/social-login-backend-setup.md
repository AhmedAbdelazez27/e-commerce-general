# إعداد تسجيل الدخول الاجتماعي — مطلوب من الباك / DevOps

**الفرونت:** E-Commerce Store (Angular)  
**Endpoint:** `POST /api/TokenAuth/ExternalAuthenticateECommerce`  
**التاريخ:** يونيو 2026

---

## القيم المستخدمة

| المزود | الحقل | القيمة |
|--------|-------|--------|
| Google | ClientId (Web) | `811170436036-5vi9egvrnv7hpa01vvpep4lidks8g4cl.apps.googleusercontent.com` |
| Facebook | AppId | `1256194259769527` |

> **Facebook AppSecret:** يبقى على السيرفر فقط — لا يُرسل للفرونت.

---

## المشكلة الحالية (Google)

```
Error 400: origin_mismatch
```

المتصفح يرفض تسجيل الدخول لأن **JavaScript origin** الخاص بالموقع غير مسجّل في Google Cloud Console على نفس Web OAuth Client.

---

## المطلوب — Google Cloud Console

1. **APIs & Services → Credentials**
2. فتح OAuth Client من نوع **Web application** (نفس ClientId أعلاه)
3. إضافة في **Authorized JavaScript origins** (بدون `/` في النهاية):

| البيئة | Origin |
|--------|--------|
| تطوير محلي | `http://localhost:4200` |
| سيرفر التطوير | `http://compassint.ddns.net:PORT` *(حسب البورت)* |
| الإنتاج | `https://DOMAIN` *(دومين المتجر)* |

**ملاحظة:** Google Sign-In (GIS) يحتاج **JavaScript origins** — ليس Redirect URIs فقط.

---

## المطلوب — Facebook Developers

1. إضافة المختبرين كـ **Testers** إذا التطبيق في Development mode
2. ضبط **App Domains** و Facebook Login لـ:
   - `localhost`
   - دومين السيرفر / الإنتاج

---

## تأكيد من الباك

- [ ] `Google.ClientId` على السيرفر = ClientId أعلاه
- [ ] `Facebook.AppId` على السيرفر = AppId أعلاه
- [ ] `ExternalAuthenticateECommerce` يقبل الطلب مع header `Abp.TenantId`
- [ ] التحقق من `idToken` (Google) و `accessToken` (Facebook) يعمل بشكل صحيح

---

## ما يرسله الفرونت للـ API

**Google:**
```json
{ "provider": "Google", "idToken": "<GOOGLE_ID_TOKEN>" }
```

**Facebook:**
```json
{ "provider": "Facebook", "accessToken": "<FACEBOOK_USER_ACCESS_TOKEN>" }
```

**Headers:** `Abp.TenantId: <tenantId>` (يُضاف تلقائياً من الفرونت)

---

## للتواصل

عند الاختبار، الفرونت يمكنه إرسال قيمة `window.location.origin` الفعلية من المتصفح لإضافتها في Google Console.
