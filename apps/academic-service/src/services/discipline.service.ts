import { getTenantDb } from '../config/database';

export class DisciplineService {

  static async getAll(schemaName: string, academicYearId: string, filters?: {
    student_id?: string;
    type?: string;
    resolved?: boolean;
    class_id?: string;
  }) {
    const db = getTenantDb(schemaName);
    let query = db('disciplinary_records as dr')
      .join('students as s', 'dr.student_id', 's.id')
      .join('users as u', 's.user_id', 'u.id')
      .leftJoin('classes as c', 's.class_id', 'c.id')
      .leftJoin('users as rep', 'dr.reported_by', 'rep.id')
      .where('dr.academic_year_id', academicYearId)
      .select(
        'dr.*',
        'u.first_name as student_first_name',
        'u.last_name as student_last_name',
        's.student_code',
        'c.name as class_name',
        'c.id as class_id',
        'rep.first_name as reporter_first_name',
        'rep.last_name as reporter_last_name',
      )
      .orderBy('dr.date', 'desc');

    if (filters?.student_id) query = query.where('dr.student_id', filters.student_id);
    if (filters?.type) query = query.where('dr.type', filters.type);
    if (filters?.resolved !== undefined) query = query.where('dr.resolved', filters.resolved);
    if (filters?.class_id) query = query.where('s.class_id', filters.class_id);

    return query;
  }

  static async getByStudent(schemaName: string, studentId: string, academicYearId: string) {
    return DisciplineService.getAll(schemaName, academicYearId, { student_id: studentId });
  }

  static async getStats(schemaName: string, academicYearId: string) {
    const db = getTenantDb(schemaName);
    const records = await db('disciplinary_records')
      .where({ academic_year_id: academicYearId })
      .select('type', 'resolved');

    const total = records.length;
    const resolved = records.filter(r => r.resolved).length;
    const pending = total - resolved;
    const byType = records.reduce((acc: any, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {});

    return { total, resolved, pending, byType };
  }

  static async create(schemaName: string, data: {
    student_id: string;
    reported_by?: string;
    academic_year_id: string;
    type: string;
    reason: string;
    description?: string;
    date: string;
  }) {
    const db = getTenantDb(schemaName);
    const [record] = await db('disciplinary_records').insert(data).returning('*');
    return record;
  }

  static async update(schemaName: string, id: string, data: Partial<{
    type: string;
    reason: string;
    description: string;
    date: string;
    resolved: boolean;
    resolution_notes: string;
  }>) {
    const db = getTenantDb(schemaName);
    const [record] = await db('disciplinary_records')
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    if (!record) throw { status: 404, message: 'Enregistrement non trouvé' };
    return record;
  }

  static async resolve(schemaName: string, id: string, resolution_notes: string) {
    return DisciplineService.update(schemaName, id, { resolved: true, resolution_notes });
  }

  static async delete(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    const deleted = await db('disciplinary_records').where({ id }).delete();
    if (!deleted) throw { status: 404, message: 'Enregistrement non trouvé' };
    return { deleted: true };
  }
}
