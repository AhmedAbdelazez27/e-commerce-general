export interface ForgetPasswordQuery {
  email: string;
  tenantId: number;
}

export interface PostForgetPasswordRequest {
  newPassword: string;
  resetToken: string;
  email: string;
  tenantId: number;
}
