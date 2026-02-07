// Common utility types
export interface PaginationParams {
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface CountryCode {
  code: string
  name: string
  flag: string
  dialCode: string
}

export interface Language {
  code: string
  name: string
  nativeName: string
  flag?: string
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'tel' | 'select' | 'textarea' | 'checkbox' | 'radio'
  required?: boolean
  placeholder?: string
  options?: SelectOption[]
  validation?: ValidationRule[]
}

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message: string
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface Breadcrumb {
  label: string
  href?: string
  active?: boolean
}

export interface MenuItem {
  label: string
  href?: string
  icon?: string
  children?: MenuItem[]
  disabled?: boolean
  external?: boolean
}