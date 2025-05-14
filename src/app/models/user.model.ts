export type Role = 'admin' | 'editor' | 'user';

export interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: string;
  __v?: number;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
}
