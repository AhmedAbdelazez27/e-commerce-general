# E-Commerce Email OTP Registration Guide

This guide covers the customer-facing Web UI and Mobile integration for normal email/password registration.

Google, Facebook, and Apple authentication do not use this OTP flow. Their signed provider tokens continue through `/api/TokenAuth/ExternalAuthenticateECommerce` without change.

## Business flow

1. The customer fills in name, email, password, and any optional profile fields.
2. The customer selects **Register**.
3. The client sends only the email address to `SendECommerceRegistrationOtp`.
4. The backend sends a six-digit OTP to that email address.
5. The client keeps the registration form locally and shows the OTP view.
6. The customer enters the OTP and selects **Verify**.
7. The client sends the OTP to `VerifyECommerceRegistrationOtp`.
8. The backend returns a short-lived, one-time `verificationToken`.
9. The client immediately sends the original form plus `verificationToken` to the existing `RegisterECommerceCustomer` endpoint.
10. Registration returns the normal access token, customer profile, tenant details, and cart. The client stores the access token and opens the signed-in home page.

No ABP user or E-Commerce customer is created before the final registration call succeeds. The password must remain only in the client form state while the OTP is being verified; never store it in browser persistence, logs, analytics, or crash reports.

## Common API conventions

Base path:

```text
/api/TokenAuth
```

All three endpoints are anonymous and require the E-Commerce tenant header:

```http
Abp.TenantId: 7
Content-Type: application/json
```

The backend also recognizes `AbpTenantId`, `Abp-TenantId`, or `TenantId`, but clients should consistently use `Abp.TenantId`.

Responses use the standard ABP wrapper:

```json
{
  "result": {},
  "targetUrl": null,
  "success": true,
  "error": null,
  "unAuthorizedRequest": false,
  "__abp": true
}
```

## Step 1: Send the OTP

### Request

```http
POST /api/TokenAuth/SendECommerceRegistrationOtp
Abp.TenantId: 7
Content-Type: application/json
```

```json
{
  "email": "customer@example.com"
}
```

### Successful response

```json
{
  "result": {
    "maskedEmail": "c***r@example.com",
    "expiresInSeconds": 300,
    "resendAfterSeconds": 60
  },
  "targetUrl": null,
  "success": true,
  "error": null,
  "unAuthorizedRequest": false,
  "__abp": true
}
```

### Client behavior

- Show the OTP entry only after `success` is `true`.
- Display `maskedEmail` in the confirmation text.
- Start the OTP expiry timer using `expiresInSeconds`.
- Disable **Resend OTP** for `resendAfterSeconds`.
- A resend uses the same endpoint and email. A new code invalidates the previous code.
- Do not clear the registration form when opening the OTP view.

If the email already belongs to an active account, the backend returns `Email is already registered.` The UI should offer **Sign in** and **Forgot password**.

## Step 2: Verify the OTP

### Request

```http
POST /api/TokenAuth/VerifyECommerceRegistrationOtp
Abp.TenantId: 7
Content-Type: application/json
```

```json
{
  "email": "customer@example.com",
  "otp": "583921"
}
```

The OTP must contain exactly six numeric digits.

### Successful response

```json
{
  "result": {
    "verificationToken": "<ONE_TIME_REGISTRATION_TOKEN>",
    "expiresInSeconds": 600
  },
  "targetUrl": null,
  "success": true,
  "error": null,
  "unAuthorizedRequest": false,
  "__abp": true
}
```

### Client behavior

- Do not display or log `verificationToken`.
- Immediately call the final registration endpoint.
- If the OTP is invalid, remain on the OTP view and display the backend error.
- After too many invalid attempts, ask the customer to request a new OTP.
- If the OTP expires, request a new OTP.

## Step 3: Complete the existing registration

### Request

```http
POST /api/TokenAuth/RegisterECommerceCustomer
Abp.TenantId: 7
Content-Type: application/json
```

```json
{
  "fullName": "Customer Name",
  "email": "customer@example.com",
  "mobile": "+971501234567",
  "gender": "Female",
  "birthDate": "1995-04-18",
  "password": "Password123!",
  "verificationToken": "<ONE_TIME_REGISTRATION_TOKEN>",
  "sessionId": "<OPTIONAL_GUEST_CART_SESSION_ID>"
}
```

Required fields:

- `fullName`
- `email`
- `password`
- `verificationToken`

Optional fields:

- `mobile`
- `gender`
- `birthDate`, formatted as `YYYY-MM-DD`; a future date is rejected
- `sessionId`, used to merge the guest cart into the registered customer cart

The `email` must be exactly the same email used in the OTP steps. The verification token is scoped to both the tenant and normalized email, expires after ten minutes by default, and can be used only once.

### Successful response

```json
{
  "result": {
    "accessToken": "<JWT_ACCESS_TOKEN>",
    "encryptedAccessToken": "<ENCRYPTED_ACCESS_TOKEN>",
    "expireInSeconds": 86400,
    "userId": 123,
    "isHost": false,
    "isTenentAdmin": false,
    "userName": "Customer",
    "tenantDetail": {
      "tenantId": 7,
      "tenantNameAr": "...",
      "tenantNameEn": "...",
      "currencyCode": "AED"
    },
    "customer": {
      "id": 456,
      "abpUserId": 123,
      "customerCode": "EC-000456",
      "fullName": "Customer Name",
      "email": "customer@example.com",
      "mobile": "+971501234567",
      "birthDate": "1995-04-18T00:00:00",
      "gender": "Female"
    },
    "cart": {
      "id": 789,
      "items": []
    }
  },
  "targetUrl": null,
  "success": true,
  "error": null,
  "unAuthorizedRequest": false,
  "__abp": true
}
```

The exact nested `tenantDetail`, `customer`, and `cart` fields follow their existing DTOs. After success, save `accessToken`, update the authenticated customer/cart state, and navigate directly to the customer home page. Do not navigate to the login page.

## Error handling

Example:

```json
{
  "result": null,
  "targetUrl": null,
  "success": false,
  "error": {
    "code": 0,
    "message": "The verification code is invalid.",
    "details": null,
    "validationErrors": null
  },
  "unAuthorizedRequest": false,
  "__abp": true
}
```

The client should display:

```javascript
response.error?.details || response.error?.message
```

Expected business errors include:

- `TenantId is required.`
- `Tenant not found.`
- `Email is already registered.`
- `Please wait ... seconds before requesting another verification code.`
- `The verification code is invalid.`
- `The verification code is invalid or has expired. Please request a new code.`
- `Too many invalid verification attempts. Please request a new code.`
- `Email verification is required. Please verify a new code and try again.`
- `The verification email could not be sent. Please try again.`
- `Birth date cannot be in the future.`

Data-annotation failures, such as an invalid email or an OTP that is not six digits, are returned in `error.validationErrors`.

## External authentication

Do not call any of these OTP endpoints for Google, Facebook, or Apple. Keep using:

```http
POST /api/TokenAuth/ExternalAuthenticateECommerce
```

External provider token validation remains the proof of identity for those registrations.

## Backend configuration and deployment

The defaults are configured in `src/ERP.Web.Host/appsettings.json`:

```json
"ECommerceRegistrationOtp": {
  "OtpExpirationSeconds": 300,
  "ResendAfterSeconds": 60,
  "VerificationTokenExpirationSeconds": 600,
  "MaxVerificationAttempts": 5
}
```

Copy this section to the deployed API configuration if production uses a separate `appsettings.json`.

The implementation reuses the existing `IEmailSender` and `SmtpConfiguration:TenxERP` SMTP configuration. It does not use Firebase and requires no database migration.

OTP and verification-token hashes are held only in API process memory. An API restart invalidates outstanding codes, and customers must request a new OTP. If the API is later deployed behind multiple active API instances, replace the process-memory store with a shared distributed cache before enabling load balancing.
