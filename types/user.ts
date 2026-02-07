// User system types
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  country_code?: string
  language?: string
  avatar?: string
  role: 'user' | 'admin' | 'moderator'
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
  last_login?: string
  email_verified?: boolean
  phone_verified?: boolean
}

export interface UserProfile {
  id: string
  user_id: string
  bio?: string
  location?: string
  website?: string
  social_links?: Record<string, string>
  preferences?: UserPreferences
}

export interface UserPreferences {
  language: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
}