export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginDataDto {
  Token: string;
  RefreshToken: string;
  UserId: string;
  TokenValidTo: string;
  NameEn: string;
  NameAr: string;
  Email: string;
}

/** Standard API envelope (PascalCase from .NET; may arrive camelCase depending on serializer). */
export interface ApiResponse<T> {
  Data?: T | null;
  data?: T | null;
  Status?: number;
  status?: number;
  Message?: string;
  message?: string;
  Success?: boolean;
  success?: boolean;
}

export interface UserProfile {
  userId: string;
  userName: string;
  email: string;
  pages: string[];
  permissions: string[];
}
