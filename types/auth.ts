import { UserProfile } from './quiz';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: number;
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  session: AuthSession | null;
  isLoading: boolean;
  isOnboardingCompleted: boolean;
  isConfiguredWithLiveSupabase: boolean;
}

export interface LoginFormData {
  emailOrUsername: string;
  password: string;
}

export interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface AuthError {
  field?: 'email' | 'password' | 'confirmPassword' | 'fullName' | 'general';
  message: string;
}
