import { getTenantDb } from '../config/database';
import bcrypt from 'bcryptjs';

export class StudentService {
  static async getAll(
    schemaName: string,
    filters: {
      class_id?: string;
      search?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const db = getTenantDb(schemaName);
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const buildBase = () =>
      db('students as s')
        .join('users as u', 's.user_id', 'u.id')
        .leftJoin('classes as c', 's.class_id', 'c.id');

    const applyFilters = (query: any) => {
      if (filters.class_id) query.where('s.class_id', filters.class_id);
      if (filters.status) query.where('s.enrollment_status', filters.status);
      if (filters.search) {
        query.where((b: any) => {
          b.whereILike('u.first_name', `%${filters.search}%`)
            .orWhereILike('u.last_name', `%${filters.search}%`)
            .orWhereILike('u.email', `%${filters.search}%`)
            .orWhereILike('s.student_code', `%${filters.search}%`);
        });
      }
      return query;
    };

    const countQuery = applyFilters(buildBase().count('s.id as count'));
    const [{ count }] = await countQuery;

    const students = await applyFilters(
      buildBase()
        .select(
          's.id',
          's.student_code',
          's.enrollment_status',
          's.enrollment_date',
          's.class_id',
          'u.first_name',
          'u.last_name',
          'u.email',
          'u.phone',
          'u.gender',
          'u.date_of_birth',
          'u.avatar_url',
          'c.name as class_name',
        )
        .orderBy('u.last_name'),
    )
      .limit(limit)
      .offset(offset);

    return {
      data: students,
      meta: {
        total: Number(count),
        page,
        limit,
        total_pages: Math.ceil(Number(count) / limit),
        has_next: page < Math.ceil(Number(count) / limit),
        has_prev: page > 1,
      },
    };
  }

  static async getById(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    const student = await db('students as s')
      .join('users as u', 's.user_id', 'u.id')
      .leftJoin('classes as c', 's.class_id', 'c.id')
      .where('s.id', id)
      .select(
        's.*',
        'u.first_name',
        'u.last_name',
        'u.email',
        'u.phone',
        'u.gender',
        'u.date_of_birth',
        'u.avatar_url',
        'u.address',
        'c.name as class_name',
      )
      .first();

    if (!student) {
      throw { code: 'STUDENT_NOT_FOUND', status: 404 };
    }
    return student;
  }

  static async create(
    schemaName: string,
    data: {
      first_name: string;
      last_name: string;
      email?: string;
      phone?: string;
      gender?: string;
      date_of_birth?: string;
      class_id?: string;
      enrollment_date?: string;
      student_code?: string;
    },
  ) {
    const db = getTenantDb(schemaName);

    const [{ count }] = await db('students').count('id as count');
    const studentCode =
      data.student_code || `STU${String(Number(count) + 1).padStart(4, '0')}`;

    const password_hash = await bcrypt.hash('Password123', 10);

    const [user] = await db('users')
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || null,
        phone: data.phone || null,
        gender: data.gender || null,
        date_of_birth: data.date_of_birth || null,
        role: 'student',
        password_hash,
      })
      .returning('*');

    const [student] = await db('students')
      .insert({
        user_id: user.id,
        student_code: studentCode,
        class_id: data.class_id || null,
        enrollment_date: data.enrollment_date || new Date(),
        enrollment_status: 'active',
      })
      .returning('*');

    return { ...student, ...user, id: student.id };
  }

  static async update(schemaName: string, id: string, data: any) {
    const db = getTenantDb(schemaName);

    const student = await db('students').where({ id }).first();
    if (!student) {
      throw { code: 'STUDENT_NOT_FOUND', status: 404 };
    }

    const userFields = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'gender',
      'date_of_birth',
    ];
    const userData: any = {};
    userFields.forEach((f) => {
      if (data[f] !== undefined) userData[f] = data[f];
    });

    if (Object.keys(userData).length > 0) {
      await db('users')
        .where({ id: student.user_id })
        .update({ ...userData, updated_at: new Date() });
    }

    const studentFields = ['class_id', 'enrollment_status', 'student_code'];
    const studentData: any = {};
    studentFields.forEach((f) => {
      if (data[f] !== undefined) studentData[f] = data[f];
    });

    if (Object.keys(studentData).length > 0) {
      await db('students')
        .where({ id })
        .update({ ...studentData, updated_at: new Date() });
    }

    return this.getById(schemaName, id);
  }

  static async delete(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    const student = await db('students').where({ id }).first();
    if (!student) {
      throw { code: 'STUDENT_NOT_FOUND', status: 404 };
    }
    await db('students').where({ id }).delete();
    await db('users').where({ id: student.user_id }).delete();
  }
  
  static async getByUserId(schemaName: string, userId: string) {
  const db = getTenantDb(schemaName);
  const student = await db('students as s')
    .join('users as u', 's.user_id', 'u.id')
    .leftJoin('classes as c', 's.class_id', 'c.id')
    .where('s.user_id', userId)
    .select(
      's.*',
      'u.first_name', 'u.last_name', 'u.email', 'u.avatar_url',
      'c.name as class_name',
    )
    .first();

  if (!student) throw { code: 'STUDENT_NOT_FOUND', status: 404 };
  return student;
}
}
