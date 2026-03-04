import { getTenantDb } from '../config/database';
import { ERROR_CODES } from '@educore/shared';

export class ClassService {
  static async getAll(schemaName: string, academicYearId?: string) {
    const db = getTenantDb(schemaName);
    const query = db('classes as c')
      .leftJoin('users as t', 'c.teacher_id', 't.id')
      .leftJoin('academic_years as ay', 'c.academic_year_id', 'ay.id')
      .select(
        'c.*',
        db.raw("CONCAT(t.first_name, ' ', t.last_name) as teacher_name"),
        'ay.name as academic_year_name',
      )
      .orderBy('c.name');

    if (academicYearId) {
      query.where('c.academic_year_id', academicYearId);
    }

    return query;
  }

  static async getById(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    const cls = await db('classes as c')
      .leftJoin('users as t', 'c.teacher_id', 't.id')
      .where('c.id', id)
      .select(
        'c.*',
        db.raw("CONCAT(t.first_name, ' ', t.last_name) as teacher_name"),
      )
      .first();

    if (!cls) throw { code: ERROR_CODES.CLASS_NOT_FOUND, status: 404 };

    // Compter les élèves
    const [{ count }] = await db('students')
      .where({ class_id: id, enrollment_status: 'active' })
      .count('id as count');

    return { ...cls, student_count: Number(count) };
  }

  static async create(
    schemaName: string,
    data: {
      name: string;
      academic_year_id: string;
      teacher_id?: string;
      level?: string;
      section?: string;
      max_capacity?: number;
      room?: string;
    },
  ) {
    const db = getTenantDb(schemaName);
    const [cls] = await db('classes').insert(data).returning('*');
    return cls;
  }

  static async update(schemaName: string, id: string, data: any) {
    const db = getTenantDb(schemaName);
    const [cls] = await db('classes')
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');

    if (!cls) throw { code: ERROR_CODES.CLASS_NOT_FOUND, status: 404 };
    return cls;
  }

  static async delete(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    await db('classes').where({ id }).delete();
  }

  static async getStudents(schemaName: string, classId: string) {
    const db = getTenantDb(schemaName);
    return db('students as s')
      .join('users as u', 's.user_id', 'u.id')
      .where({ 's.class_id': classId, 's.enrollment_status': 'active' })
      .select(
        's.id',
        's.student_code',
        's.enrollment_status',
        'u.first_name',
        'u.last_name',
        'u.email',
        'u.gender',
        'u.avatar_url',
      )
      .orderBy('u.last_name');
  }
}
