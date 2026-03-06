import { getTenantDb } from '../config/database';
import bcrypt from 'bcryptjs';

export class ParentService {

  static async getAll(schemaName: string, filters: {
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const db = getTenantDb(schemaName);
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const buildBase = () => db('parents as p')
      .join('users as u', 'p.user_id', 'u.id');

    const applyFilters = (query: any) => {
      if (filters.search) {
        query.where((b: any) => {
          b.whereILike('u.first_name', `%${filters.search}%`)
            .orWhereILike('u.last_name', `%${filters.search}%`)
            .orWhereILike('u.email', `%${filters.search}%`)
            .orWhereILike('p.parent_code', `%${filters.search}%`);
        });
      }
      return query;
    };

    const [{ count }] = await applyFilters(buildBase().count('p.id as count'));
    const parents = await applyFilters(buildBase().select(
      'p.id', 'p.parent_code', 'p.profession', 'p.is_active',
      'u.first_name', 'u.last_name', 'u.email', 'u.phone', 'u.gender',
    ).orderBy('u.last_name')).limit(limit).offset(offset);

    return {
      data: parents,
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
    const parent = await db('parents as p')
      .join('users as u', 'p.user_id', 'u.id')
      .where('p.id', id)
      .select('p.*', 'u.first_name', 'u.last_name', 'u.email', 'u.phone', 'u.gender')
      .first();

    if (!parent) throw { code: 'PARENT_NOT_FOUND', status: 404 };

    const students = await db('parent_students as ps')
      .join('students as s', 'ps.student_id', 's.id')
      .join('users as u', 's.user_id', 'u.id')
      .leftJoin('classes as c', 's.class_id', 'c.id')
      .where('ps.parent_id', id)
      .select(
        's.id', 's.student_code', 's.enrollment_status',
        'u.first_name', 'u.last_name', 'u.email',
        'c.name as class_name',
        'ps.relationship', 'ps.is_primary',
      );

    return { ...parent, students };
  }

  static async getByUserId(schemaName: string, userId: string) {
    const db = getTenantDb(schemaName);
    const parent = await db('parents as p')
      .join('users as u', 'p.user_id', 'u.id')
      .where('p.user_id', userId)
      .select('p.*', 'u.first_name', 'u.last_name', 'u.email', 'u.phone', 'u.avatar_url')
      .first();

    if (!parent) throw { code: 'PARENT_NOT_FOUND', status: 404 };

    const students = await db('parent_students as ps')
      .join('students as s', 'ps.student_id', 's.id')
      .join('users as u', 's.user_id', 'u.id')
      .leftJoin('classes as c', 's.class_id', 'c.id')
      .where('ps.parent_id', parent.id)
      .select(
        's.id', 's.student_code', 's.enrollment_status', 's.class_id',
        'u.first_name', 'u.last_name', 'u.email',
        'c.name as class_name',
        'ps.relationship', 'ps.is_primary',
      );

    return { ...parent, students };
  }

  static async create(schemaName: string, data: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    gender?: string;
    profession?: string;
    parent_code?: string;
  }) {
    const db = getTenantDb(schemaName);

    const existing = await db('users').where({ email: data.email }).first();
    if (existing) throw { code: 'EMAIL_ALREADY_EXISTS', status: 400 };

    const [{ count }] = await db('parents').count('id as count');
    const parentCode = data.parent_code ||
      `PAR${String(Number(count) + 1).padStart(3, '0')}`;

    const password_hash = await bcrypt.hash('Password123', 10);

    const [user] = await db('users').insert({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone || null,
      gender: data.gender || null,
      role: 'parent',
      password_hash,
    }).returning('*');

    const [parent] = await db('parents').insert({
      user_id: user.id,
      parent_code: parentCode,
      profession: data.profession || null,
      is_active: true,
    }).returning('*');

    return { ...parent, ...user, id: parent.id };
  }

  static async update(schemaName: string, id: string, data: any) {
    const db = getTenantDb(schemaName);
    const parent = await db('parents').where({ id }).first();
    if (!parent) throw { code: 'PARENT_NOT_FOUND', status: 404 };

    const userFields = ['first_name', 'last_name', 'email', 'phone', 'gender'];
    const userData: any = {};
    userFields.forEach((f) => { if (data[f] !== undefined) userData[f] = data[f]; });
    if (Object.keys(userData).length > 0) {
      await db('users').where({ id: parent.user_id })
        .update({ ...userData, updated_at: new Date() });
    }

    const parentFields = ['profession', 'is_active', 'parent_code'];
    const parentData: any = {};
    parentFields.forEach((f) => { if (data[f] !== undefined) parentData[f] = data[f]; });
    if (Object.keys(parentData).length > 0) {
      await db('parents').where({ id })
        .update({ ...parentData, updated_at: new Date() });
    }

    return this.getById(schemaName, id);
  }

  static async delete(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    const parent = await db('parents').where({ id }).first();
    if (!parent) throw { code: 'PARENT_NOT_FOUND', status: 404 };
    await db('parents').where({ id }).delete();
    await db('users').where({ id: parent.user_id }).delete();
  }

  static async linkStudent(schemaName: string, data: {
    parent_id: string;
    student_id: string;
    relationship?: string;
    is_primary?: boolean;
  }) {
    const db = getTenantDb(schemaName);
    const [link] = await db('parent_students')
      .insert({
        parent_id: data.parent_id,
        student_id: data.student_id,
        relationship: data.relationship || 'parent',
        is_primary: data.is_primary || false,
      })
      .onConflict(['parent_id', 'student_id'])
      .merge()
      .returning('*');
    return link;
  }

  static async unlinkStudent(schemaName: string, parentId: string, studentId: string) {
    const db = getTenantDb(schemaName);
    await db('parent_students')
      .where({ parent_id: parentId, student_id: studentId })
      .delete();
  }
}