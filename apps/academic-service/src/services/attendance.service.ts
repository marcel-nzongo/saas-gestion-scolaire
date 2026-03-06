import { getTenantDb } from '../config/database';

export class AttendanceService {

  static async getAll(schemaName: string, filters: {
    student_id?: string;
    class_id?: string;
    academic_year_id?: string;
    type?: string;
    is_justified?: boolean;
    from_date?: string;
    to_date?: string;
  }) {
    const db = getTenantDb(schemaName);

    const query = db('attendances as a')
      .join('students as s', 'a.student_id', 's.id')
      .join('users as u', 's.user_id', 'u.id')
      .leftJoin('classes as c', 'a.class_id', 'c.id')
      .select(
        'a.*',
        'u.first_name as student_first_name',
        'u.last_name as student_last_name',
        's.student_code',
        'c.name as class_name',
      )
      .orderBy('a.date', 'desc');

    if (filters.student_id) query.where('a.student_id', filters.student_id);
    if (filters.class_id) query.where('a.class_id', filters.class_id);
    if (filters.academic_year_id) query.where('a.academic_year_id', filters.academic_year_id);
    if (filters.type) query.where('a.type', filters.type);
    if (filters.is_justified !== undefined) query.where('a.is_justified', filters.is_justified);
    if (filters.from_date) query.where('a.date', '>=', filters.from_date);
    if (filters.to_date) query.where('a.date', '<=', filters.to_date);

    return query;
  }

  static async getStats(schemaName: string, studentId: string, academicYearId: string) {
    const db = getTenantDb(schemaName);

    const absences = await db('attendances')
      .where({ student_id: studentId, academic_year_id: academicYearId, type: 'absence' })
      .count('id as count')
      .first();

    const justified = await db('attendances')
      .where({ student_id: studentId, academic_year_id: academicYearId, type: 'absence', is_justified: true })
      .count('id as count')
      .first();

    const lates = await db('attendances')
      .where({ student_id: studentId, academic_year_id: academicYearId, type: 'late' })
      .count('id as count')
      .first();

    const totalMinutes = await db('attendances')
      .where({ student_id: studentId, academic_year_id: academicYearId, type: 'late' })
      .sum('duration_minutes as total')
      .first();

    return {
      total_absences: Number(absences?.count || 0),
      justified_absences: Number(justified?.count || 0),
      unjustified_absences: Number(absences?.count || 0) - Number(justified?.count || 0),
      total_lates: Number(lates?.count || 0),
      total_late_minutes: Number(totalMinutes?.total || 0),
    };
  }

  static async create(schemaName: string, data: {
    student_id: string;
    class_id: string;
    academic_year_id: string;
    date: string;
    type: string;
    duration_minutes?: number;
    reason?: string;
    is_justified?: boolean;
    created_by: string;
  }) {
    const db = getTenantDb(schemaName);
    const [attendance] = await db('attendances').insert(data).returning('*');
    return attendance;
  }

  static async update(schemaName: string, id: string, data: {
    is_justified?: boolean;
    reason?: string;
    justified_by?: string;
    justified_at?: string;
  }) {
    const db = getTenantDb(schemaName);
    const [attendance] = await db('attendances')
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return attendance;
  }

  static async delete(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    await db('attendances').where({ id }).delete();
  }
}