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
  sessionId: string | null;
}
