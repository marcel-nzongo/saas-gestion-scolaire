import { getTenantDb } from '../config/database';

export class TimetableService {

  static async getByClass(schemaName: string, classId: string, academicYearId: string) {
    const db = getTenantDb(schemaName);
    return db('timetable_slots as ts')
      .join('subjects as sub', 'ts.subject_id', 'sub.id')
      .leftJoin('users as t', 'ts.teacher_id', 't.id')
      .where({ 'ts.class_id': classId, 'ts.academic_year_id': academicYearId })
      .select(
        'ts.*',
        'sub.name as subject_name',
        't.first_name as teacher_first_name',
        't.last_name as teacher_last_name',
      )
      .orderBy(['ts.day_of_week', 'ts.start_time']);
  }

  static async getByTeacher(schemaName: string, teacherUserId: string, academicYearId: string) {
    const db = getTenantDb(schemaName);
    return db('timetable_slots as ts')
      .join('subjects as sub', 'ts.subject_id', 'sub.id')
      .join('classes as c', 'ts.class_id', 'c.id')
      .where({ 'ts.teacher_id': teacherUserId, 'ts.academic_year_id': academicYearId })
      .select(
        'ts.*',
        'sub.name as subject_name',
        'c.name as class_name',
      )
      .orderBy(['ts.day_of_week', 'ts.start_time']);
  }

  static async getByStudent(schemaName: string, studentId: string, academicYearId: string) {
    const db = getTenantDb(schemaName);
    const student = await db('students').where({ id: studentId }).first();
    if (!student?.class_id) return [];
    return TimetableService.getByClass(schemaName, student.class_id, academicYearId);
  }

  static async create(schemaName: string, data: {
    class_id: string;
    subject_id: string;
    teacher_id?: string;
    academic_year_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room?: string;
  }) {
    const db = getTenantDb(schemaName);

    // Vérifier conflit de créneau pour la classe
    const conflict = await db('timetable_slots')
      .where({
        class_id: data.class_id,
        academic_year_id: data.academic_year_id,
        day_of_week: data.day_of_week,
      })
      .andWhere(function () {
        this.where('start_time', '<', data.end_time)
            .andWhere('end_time', '>', data.start_time);
      })
      .first();

    if (conflict) throw { status: 409, message: 'Conflit de créneau : ce cours chevauche un autre créneau pour cette classe' };

    // Vérifier conflit professeur
    if (data.teacher_id) {
      const teacherConflict = await db('timetable_slots')
        .where({
          teacher_id: data.teacher_id,
          academic_year_id: data.academic_year_id,
          day_of_week: data.day_of_week,
        })
        .andWhere(function () {
          this.where('start_time', '<', data.end_time)
              .andWhere('end_time', '>', data.start_time);
        })
        .first();

      if (teacherConflict) throw { status: 409, message: 'Conflit : ce professeur a déjà un cours sur ce créneau' };
    }

    const [slot] = await db('timetable_slots').insert(data).returning('*');
    return slot;
  }

  static async update(schemaName: string, id: string, data: Partial<{
    subject_id: string;
    teacher_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string;
  }>) {
    const db = getTenantDb(schemaName);
    const [slot] = await db('timetable_slots').where({ id }).update({ ...data, updated_at: new Date() }).returning('*');
    if (!slot) throw { status: 404, message: 'Créneau non trouvé' };
    return slot;
  }

  static async delete(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    const deleted = await db('timetable_slots').where({ id }).delete();
    if (!deleted) throw { status: 404, message: 'Créneau non trouvé' };
    return { deleted: true };
  }
}
