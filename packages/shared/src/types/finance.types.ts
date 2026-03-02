// ================================
// Types liés à la finance
// ================================

export type PaymentMethod =
  | 'cash'
  | 'wave'
  | 'orange_money'
  | 'card'
  | 'bank'
  | 'cheque';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type FeeFrequency = 'once' | 'monthly' | 'trimester' | 'annual';

export interface FeeStructure {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  frequency: FeeFrequency;
  academic_year_id?: string;
  due_date?: Date;
  applicable_to: Record<string, unknown>;
  is_active: boolean;
}

export interface Payment {
  id: string;
  student_id: string;
  fee_structure_id?: string;
  amount_paid: number;
  currency: string;
  payment_method: PaymentMethod;
  transaction_ref?: string;
  status: PaymentStatus;
  receipt_number?: string;
  notes?: string;
  paid_at?: Date;
  collected_by?: string;
  created_at: Date;
}

export interface PaymentSummary {
  student_id: string;
  total_due: number;
  total_paid: number;
  balance: number;
  currency: string;
  last_payment_date?: Date;
}
