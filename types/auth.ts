// Authentication related types
import { User } from './user'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  name: string
  email: string
  password: string
  phone?: string
  country_code?: string
  language?: string
}

export interface PhoneVerificationData {
  phone: string
  country_code: string
  otp: string
}

export interface PasswordResetData {
  email: string
  token: string
  newPassword: string
}