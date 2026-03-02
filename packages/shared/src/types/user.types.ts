// ================================
// Types liés aux Utilisateurs
// ================================

export type UserRole =
  | 'admin'
  | 'teacher'
  | 'student'
  | 'parent'
  | 'accountant'
  | 'librarian';

export type Gender = 'male' | 'female' | 'other';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  gender?: Gender;
  date_of_birth?: Date;
  avatar_url?: string;
  address?: Address;
  is_active: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Address {
  street?: string;
  city?: string;
  region?: string;
  country?: string;
  postal_code?: string;
}

export interface UserWithoutPassword extends Omit<User, 'password_hash'> {}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  phone?: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  tenant_id: string;
  schema_name: string;
  permissions: string[];
}
