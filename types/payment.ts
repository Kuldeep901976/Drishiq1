// Payment system types
export interface Payment {
  id: string
  user_id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method: 'paypal' | 'bank_transfer'
  payment_intent_id?: string
  transaction_id?: string
  description: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface PaymentMethod {
  id: string
  user_id: string
  type: 'card' | 'bank_account' | 'paypal'
  last4?: string
  brand?: string
  exp_month?: number
  exp_year?: number
  is_default: boolean
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
  canceled_at?: string
}

export interface PricingPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  is_popular: boolean
  is_active: boolean
}


