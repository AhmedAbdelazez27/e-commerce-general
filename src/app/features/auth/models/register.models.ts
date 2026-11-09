export interface RegisterFormValue {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  birthDate?: string | null;
  gender?: string | null;
}

export interface RegisterECommerceCustomerRequest {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  verificationToken: string;
  sessionId: string | null;
  birthDate?: string | null;
  gender?: string | null;
}

export interface SendRegistrationOtpRequest {
  email: string;
}

export interface SendRegistrationOtpResult {
  maskedEmail: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export interface VerifyRegistrationOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyRegistrationOtpResult {
  verificationToken: string;
  expiresInSeconds: number;
}
