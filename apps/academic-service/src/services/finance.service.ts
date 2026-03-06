import { getTenantDb } from '../config/database';

export class FinanceService {

  // ── Fee Types ──────────────────────────────────────────
  static async getFeeTypes(schemaName: string) {
    const db = getTenantDb(schemaName);
    return db('fee_types').where({ is_active: true }).orderBy('name');
  }

  static async createFeeType(schemaName: string, data: {
    name: string;
    description?: string;
  }) {
    const db = getTenantDb(schemaName);
    const [feeType] = await db('fee_types').insert(data).returning('*');
    return feeType;
  }

  // ── Fees ───────────────────────────────────────────────
  static async getFees(schemaName: string, filters: {
    academic_year_id?: string;
    class_id?: string;
  }) {
    const db = getTenantDb(schemaName);
    const query = db('fees as f')
      .join('fee_types as ft', 'f.fee_type_id', 'ft.id')
      .leftJoin('classes as c', 'f.class_id', 'c.id')
      .select(
        'f.*',
        'ft.name as fee_type_name',
        'ft.description as fee_type_description',
        'c.name as class_name',
      )
      .orderBy('ft.name');

    if (filters.academic_year_id) query.where('f.academic_year_id', filters.academic_year_id);
    if (filters.class_id) query.where('f.class_id', filters.class_id);

    return query;
  }

  static async createFee(schemaName: string, data: {
    fee_type_id: string;
    class_id?: string;
    academic_year_id: string;
    amount: number;
    due_date?: string;
    is_mandatory?: boolean;
  }) {
    const db = getTenantDb(schemaName);
    const [fee] = await db('fees').insert(data).returning('*');
    return fee;
  }

  static async deleteFee(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    await db('fees').where({ id }).delete();
  }

  // ── Payments ───────────────────────────────────────────
  static async getPayments(schemaName: string, filters: {
    student_id?: string;
    academic_year_id?: string;
    class_id?: string;
    fee_id?: string;
  }) {
    const db = getTenantDb(schemaName);
    const query = db('payments as p')
      .join('students as s', 'p.student_id', 's.id')
      .join('users as u', 's.user_id', 'u.id')
      .join('fees as f', 'p.fee_id', 'f.id')
      .join('fee_types as ft', 'f.fee_type_id', 'ft.id')
      .leftJoin('classes as c', 'f.class_id', 'c.id')
      .select(
        'p.*',
        'u.first_name as student_first_name',
        'u.last_name as student_last_name',
        's.student_code',
        'ft.name as fee_type_name',
        'c.name as class_name',
        'f.amount as fee_amount',
      )
      .orderBy('p.payment_date', 'desc');

    if (filters.student_id) query.where('p.student_id', filters.student_id);
    if (filters.academic_year_id) query.where('p.academic_year_id', filters.academic_year_id);
    if (filters.fee_id) query.where('p.fee_id', filters.fee_id);
    if (filters.class_id) query.where('f.class_id', filters.class_id);

    return query;
  }

  static async createPayment(schemaName: string, data: {
    student_id: string;
    fee_id: string;
    academic_year_id: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference?: string;
    notes?: string;
    received_by: string;
  }) {
    const db = getTenantDb(schemaName);
    const [payment] = await db('payments').insert(data).returning('*');
    return payment;
  }

  static async deletePayment(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    await db('payments').where({ id }).delete();
  }

  // ── Soldes & Stats ─────────────────────────────────────
  static async getStudentBalance(schemaName: string, studentId: string, academicYearId: string) {
    const db = getTenantDb(schemaName);

    // Récupère la classe de l'élève
    const student = await db('students as s')
      .join('users as u', 's.user_id', 'u.id')
      .leftJoin('classes as c', 's.class_id', 'c.id')
      .where('s.id', studentId)
      .select('s.*', 'u.first_name', 'u.last_name', 'c.name as class_name')
      .first();

    if (!student) throw { code: 'STUDENT_NOT_FOUND', status: 404 };

    // Frais applicables (pour sa classe ou globaux)
    const fees = await db('fees as f')
      .join('fee_types as ft', 'f.fee_type_id', 'ft.id')
      .where('f.academic_year_id', academicYearId)
      .where(function () {
        this.where('f.class_id', student.class_id).orWhereNull('f.class_id');
      })
      .select('f.*', 'ft.name as fee_type_name');

    // Paiements effectués
    const payments = await db('payments')
      .where({ student_id: studentId, academic_year_id: academicYearId })
      .select('*');

    const totalFees = fees.reduce((sum: number, f: any) => sum + Number(f.amount), 0);
    const totalPaid = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    return {
      student,
      fees,
      payments,
      total_fees: totalFees,
      total_paid: totalPaid,
      balance: totalFees - totalPaid,
      is_paid: totalPaid >= totalFees,
    };
  }

  static async getStats(schemaName: string, academicYearId: string) {
    const db = getTenantDb(schemaName);

    const totalFees = await db('fees')
      .where({ academic_year_id: academicYearId })
      .sum('amount as total')
      .first();

    const totalPayments = await db('payments')
      .where({ academic_year_id: academicYearId })
      .sum('amount as total')
      .first();

    const studentCount = await db('students')
      .where({ enrollment_status: 'active' })
      .count('id as count')
      .first();

    const paymentCount = await db('payments')
      .where({ academic_year_id: academicYearId })
      .count('id as count')
      .first();

    return {
      total_expected: Number(totalFees?.total || 0),
      total_collected: Number(totalPayments?.total || 0),
      total_remaining: Number(totalFees?.total || 0) - Number(totalPayments?.total || 0),
      student_count: Number(studentCount?.count || 0),
      payment_count: Number(paymentCount?.count || 0),
    };
  }

  static async getClassBalance(schemaName: string, classId: string, academicYearId: string) {
    const db = getTenantDb(schemaName);

    const students = await db('students').where({ class_id: classId, enrollment_status: 'active' });

    const results = await Promise.all(
      students.map((s: any) => FinanceService.getStudentBalance(schemaName, s.id, academicYearId))
    );

    return results;
  }
}