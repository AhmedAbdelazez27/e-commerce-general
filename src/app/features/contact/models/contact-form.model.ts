export interface CrmContactUsCreateRequest {
  phone1: string;
  email: string;
  name: string;
  companyName: string;
  message: string;
  tenancyName: string;
  tenantId: number;
}

export interface ContactFormValue {
  name: string;
  email: string;
  phone1: string;
  companyName: string;
  message: string;
}
