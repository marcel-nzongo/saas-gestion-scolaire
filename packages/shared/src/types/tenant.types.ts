// ================================
// Types liés aux Tenants (Écoles)
// ================================

export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  schema_name: string;
  plan_id: string;
  status: TenantStatus;
  country_code: string;
  timezone: string;
  locale: string;
  currency: string;
  max_students: number;
  storage_quota_gb: number;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  settings: Record<string, unknown>;
  trial_ends_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Plan {
  id: string;
  name: string;
  code: string;
  price_monthly: number;
  price_yearly: number;
  max_students: number;
  max_teachers: number;
  max_storage_gb: number;
  features: PlanFeatures;
  is_active: boolean;
}

export interface PlanFeatures {
  grades: boolean;
  attendance: boolean;
  finance: boolean;
  notifications: boolean;
  reports: boolean;
  api_access?: boolean;
}

export interface TenantContext {
  id: string;
  schema_name: string;
  subdomain: string;
  locale: string;
  currency: string;
  plan: Plan;
}
