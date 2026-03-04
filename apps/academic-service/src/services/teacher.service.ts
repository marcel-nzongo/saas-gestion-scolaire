import { getTenantDb } from '../config/database';
import bcrypt from 'bcryptjs';

export class TeacherService {
  static async getAll(
    schemaName: string,
    filters: {
      search?: string;
      is_active?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    const db = getTenantDb(schemaName);
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const buildBase = () =>
      db('teachers as t').join('users as u', 't.user_id', 'u.id');

    const applyFilters = (query: any) => {
      if (filters.is_active !== undefined) {
        query.where('t.is_active', filters.is_active);
      }
      if (filters.search) {
        query.where((b: any) => {
          b.whereILike('u.first_name', `%${filters.search}%`)
            .orWhereILike('u.last_name', `%${filters.search}%`)
            .orWhereILike('u.email', `%${filters.search}%`)
            .orWhereILike('t.teacher_code', `%${filters.search}%`);
        });
      }
      return query;
    };

    const [{ count }] = await applyFilters(buildBase().count('t.id as count'));

    const teachers = await applyFilters(
      buildBase()
        .select(
          't.id',
          't.teacher_code',
          't.speciality',
          't.hire_date',
          't.is_active',
          'u.first_name',
          'u.last_name',
          'u.email',
          'u.phone',
          'u.gender',
          'u.avatar_url',
        )
        .orderBy('u.last_name'),
    )
      .limit(limit)
      .offset(offset);

    return {
      data: teachers,
      meta: {
        total: Number(count),
        page,
        limit,
        total_pages: Math.ceil(Number(count) / limit),
      },
    };
  }

  static async getById(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    const teacher = await db('teachers as t')
      .join('users as u', 't.user_id', 'u.id')
      .where('t.id', id)
      .select(
        't.*',
        'u.first_name',
        'u.last_name',
        'u.email',
        'u.phone',
        'u.gender',
        'u.avatar_url',
      )
      .first();

    if (!teacher) throw { code: 'TEACHER_NOT_FOUND', status: 404 };

    // Récupérer les assignations
    const assignments = await db('teacher_assignments as ta')
      .join('classes as c', 'ta.class_id', 'c.id')
      .join('subjects as s', 'ta.subject_id', 's.id')
      .where('ta.teacher_id', id)
      .select(
        'ta.id',
        'ta.is_main_teacher',
        'c.id as class_id',
        'c.name as class_name',
        's.id as subject_id',
        's.name as subject_name',
        's.color as subject_color',
      );

    return { ...teacher, assignments };
  }

  static async getByUserId(schemaName: string, userId: string) {
    const db = getTenantDb(schemaName);
    const teacher = await db('teachers as t')
      .join('users as u', 't.user_id', 'u.id')
      .where('t.user_id', userId)
      .select('t.*', 'u.first_name', 'u.last_name', 'u.email', 'u.avatar_url')
      .first();

    if (!teacher) throw { code: 'TEACHER_NOT_FOUND', status: 404 };

    const assignments = await db('teacher_assignments as ta')
      .join('classes as c', 'ta.class_id', 'c.id')
      .join('subjects as s', 'ta.subject_id', 's.id')
      .where('ta.teacher_id', teacher.id)
      .select(
        'ta.id',
        'ta.is_main_teacher',
        'c.id as class_id',
        'c.name as class_name',
        's.id as subject_id',
        's.name as subject_name',
        's.color as subject_color',
      );

    return { ...teacher, assignments };
  }

  static async create(
    schemaName: string,
    data: {
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
      gender?: string;
      speciality?: string;
      hire_date?: string;
      teacher_code?: string;
    },
  ) {
    const db = getTenantDb(schemaName);

    // Vérifier email unique
    const existing = await db('users').where({ email: data.email }).first();
    if (existing) throw { code: 'EMAIL_ALREADY_EXISTS', status: 400 };

    const [{ count }] = await db('teachers').count('id as count');
    const teacherCode =
      data.teacher_code || `PROF${String(Number(count) + 1).padStart(3, '0')}`;

    const password_hash = await bcrypt.hash('Password123', 10);

    const [user] = await db('users')
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || null,
        gender: data.gender || null,
        role: 'teacher',
        password_hash,
      })
      .returning('*');

    const [teacher] = await db('teachers')
      .insert({
        user_id: user.id,
        teacher_code: teacherCode,
        speciality: data.speciality || null,
        hire_date: data.hire_date || null,
        is_active: true,
      })
      .returning('*');

    return { ...teacher, ...user, id: teacher.id };
  }

  static async update(schemaName: string, id: string, data: any) {
    const db = getTenantDb(schemaName);
    const teacher = await db('teachers').where({ id }).first();
    if (!teacher) throw { code: 'TEACHER_NOT_FOUND', status: 404 };

    const userFields = ['first_name', 'last_name', 'email', 'phone', 'gender'];
    const userData: any = {};
    userFields.forEach((f) => {
      if (data[f] !== undefined) userData[f] = data[f];
    });

    if (Object.keys(userData).length > 0) {
      await db('users')
        .where({ id: teacher.user_id })
        .update({ ...userData, updated_at: new Date() });
    }

    const teacherFields = [
      'speciality',
      'hire_date',
      'is_active',
      'teacher_code',
    ];
    const teacherData: any = {};
    teacherFields.forEach((f) => {
      if (data[f] !== undefined) teacherData[f] = data[f];
    });

    if (Object.keys(teacherData).length > 0) {
      await db('teachers')
        .where({ id })
        .update({ ...teacherData, updated_at: new Date() });
    }

    return this.getById(schemaName, id);
  }

  static async delete(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    const teacher = await db('teachers').where({ id }).first();
    if (!teacher) throw { code: 'TEACHER_NOT_FOUND', status: 404 };
    await db('teachers').where({ id }).delete();
    await db('users').where({ id: teacher.user_id }).delete();
  }

  static async assignClass(
    schemaName: string,
    data: {
      teacher_id: string;
      class_id: string;
      subject_id: string;
      academic_year_id: string;
      is_main_teacher?: boolean;
    },
  ) {
    const db = getTenantDb(schemaName);
    const [assignment] = await db('teacher_assignments')
      .insert({
        teacher_id: data.teacher_id,
        class_id: data.class_id,
        subject_id: data.subject_id,
        academic_year_id: data.academic_year_id,
        is_main_teacher: data.is_main_teacher || false,
      })
      .onConflict(['teacher_id', 'class_id', 'subject_id', 'academic_year_id'])
      .merge()
      .returning('*');
    return assignment;
  }

  static async removeAssignment(schemaName: string, assignmentId: string) {
    const db = getTenantDb(schemaName);
    await db('teacher_assignments').where({ id: assignmentId }).delete();
  }

  static async getAssignments(
    schemaName: string,
    teacherId: string,
    academicYearId: string,
  ) {
    const db = getTenantDb(schemaName);
    return db('teacher_assignments as ta')
      .join('classes as c', 'ta.class_id', 'c.id')
      .join('subjects as s', 'ta.subject_id', 's.id')
      .where({
        'ta.teacher_id': teacherId,
        'ta.academic_year_id': academicYearId,
      })
      .select(
        'ta.id',
        'ta.is_main_teacher',
        'c.id as class_id',
        'c.name as class_name',
        's.id as subject_id',
        's.name as subject_name',
        's.color as subject_color',
      );
  }
}
