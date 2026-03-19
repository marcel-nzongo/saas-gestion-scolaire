import { getTenantDb } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export class VirtualClassService {

  static generateRoomName(title: string, id: string): string {
    const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
    return `educore-${slug}-${id.substring(0, 8)}`;
  }

  static async getAll(schemaName: string, filters: {
    academic_year_id?: string;
    class_id?: string;
    teacher_id?: string;
    status?: string;
  }) {
    const db = getTenantDb(schemaName);
    let query = db('virtual_classes as vc')
      .leftJoin('teachers as t', 'vc.teacher_id', 't.id')
      .leftJoin('users as u', 't.user_id', 'u.id')
      .leftJoin('classes as c', 'vc.class_id', 'c.id')
      .leftJoin('subjects as s', 'vc.subject_id', 's.id')
      .select(
        'vc.*',
        db.raw("u.first_name || ' ' || u.last_name as teacher_name"),
        'c.name as class_name',
        's.name as subject_name',
        's.color as subject_color',
      )
      .orderBy('vc.scheduled_at', 'desc');

    if (filters.academic_year_id) query = query.where('vc.academic_year_id', filters.academic_year_id);
    if (filters.class_id) query = query.where('vc.class_id', filters.class_id);
    if (filters.teacher_id) query = query.where('vc.teacher_id', filters.teacher_id);
    if (filters.status) query = query.where('vc.status', filters.status);

    return query;
  }

  static async getById(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    const vc = await db('virtual_classes as vc')
      .leftJoin('teachers as t', 'vc.teacher_id', 't.id')
      .leftJoin('users as u', 't.user_id', 'u.id')
      .leftJoin('classes as c', 'vc.class_id', 'c.id')
      .leftJoin('subjects as s', 'vc.subject_id', 's.id')
      .where('vc.id', id)
      .select(
        'vc.*',
        db.raw("u.first_name || ' ' || u.last_name as teacher_name"),
        'c.name as class_name',
        's.name as subject_name',
      )
      .first();

    if (!vc) throw { status: 404, message: 'Classe virtuelle non trouvée' };

    const documents = await db('virtual_class_documents')
      .where({ virtual_class_id: id })
      .orderBy('created_at', 'desc');

    return { ...vc, documents };
  }

  static async create(schemaName: string, data: {
    title: string;
    description?: string;
    teacher_id: string;
    class_id?: string;
    subject_id?: string;
    academic_year_id: string;
    scheduled_at: string;
    duration_minutes?: number;
  }) {
    const db = getTenantDb(schemaName);
    const id = uuidv4();
    const jitsi_room = VirtualClassService.generateRoomName(data.title, id);

    const [created] = await db('virtual_classes').insert({
      id,
      ...data,
      jitsi_room,
      status: 'scheduled',
    }).returning('*');

    return VirtualClassService.getById(schemaName, created.id);
  }

  static async updateStatus(schemaName: string, id: string, status: string) {
    const db = getTenantDb(schemaName);
    await db('virtual_classes').where({ id }).update({ status, updated_at: db.fn.now() });
    return VirtualClassService.getById(schemaName, id);
  }

  static async update(schemaName: string, id: string, data: any) {
    const db = getTenantDb(schemaName);
    await db('virtual_classes').where({ id }).update({ ...data, updated_at: db.fn.now() });
    return VirtualClassService.getById(schemaName, id);
  }

  static async delete(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    await db('virtual_classes').where({ id }).delete();
  }

  static async addDocument(schemaName: string, virtualClassId: string, doc: {
    name: string;
    url: string;
    uploaded_by?: string;
  }) {
    const db = getTenantDb(schemaName);
    const [created] = await db('virtual_class_documents').insert({
      id: uuidv4(),
      virtual_class_id: virtualClassId,
      ...doc,
    }).returning('*');
    return created;
  }

  static async deleteDocument(schemaName: string, docId: string) {
    const db = getTenantDb(schemaName);
    await db('virtual_class_documents').where({ id: docId }).delete();
  }

  // Séances du jour pour un enseignant
  static async getTodayByTeacher(schemaName: string, teacherId: string) {
    const db = getTenantDb(schemaName);
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const end = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    return db('virtual_classes as vc')
      .leftJoin('classes as c', 'vc.class_id', 'c.id')
      .leftJoin('subjects as s', 'vc.subject_id', 's.id')
      .where('vc.teacher_id', teacherId)
      .whereBetween('vc.scheduled_at', [start, end])
      .select('vc.*', 'c.name as class_name', 's.name as subject_name')
      .orderBy('vc.scheduled_at');
  }

  // Séances pour un élève (via sa classe)
  static async getByStudent(schemaName: string, studentId: string, academicYearId: string) {
    const db = getTenantDb(schemaName);
    const student = await db('students').where({ id: studentId }).first();
    if (!student?.class_id) return [];
    return db('virtual_classes as vc')
      .leftJoin('teachers as t', 'vc.teacher_id', 't.id')
      .leftJoin('users as u', 't.user_id', 'u.id')
      .leftJoin('subjects as s', 'vc.subject_id', 's.id')
      .where('vc.class_id', student.class_id)
      .where('vc.academic_year_id', academicYearId)
      .select(
        'vc.*',
        db.raw("u.first_name || ' ' || u.last_name as teacher_name"),
        's.name as subject_name',
        's.color as subject_color',
      )
      .orderBy('vc.scheduled_at', 'desc');
  }
}
