import { getTenantDb } from '../config/database';
import { ERROR_CODES } from '@educore/shared';

export class GradeService {
  // ================================
  // RÉCUPÉRER LES NOTES
  // ================================
  static async getAll(
    schemaName: string,
    filters: {
      student_id?: string;
      subject_id?: string;
      class_id?: string;
      term?: number;
      academic_year_id?: string;
      is_published?: boolean;
    },
  ) {
    const db = getTenantDb(schemaName);

    const query = db('grades as g')
      .join('students as s', 'g.student_id', 's.id')
      .join('users as u', 's.user_id', 'u.id')
      .join('subjects as sub', 'g.subject_id', 'sub.id')
      .leftJoin('users as t', 'g.teacher_id', 't.id')
      .select(
        'g.*',
        'u.first_name',
        'u.last_name',
        'sub.name as subject_name',
        'sub.color as subject_color',
        db.raw("CONCAT(t.first_name, ' ', t.last_name) as teacher_name"),
      )
      .orderBy('g.graded_at', 'desc');

    if (filters.student_id) query.where('g.student_id', filters.student_id);
    if (filters.subject_id) query.where('g.subject_id', filters.subject_id);
    if (filters.term) query.where('g.term', filters.term);
    if (filters.academic_year_id) {
      query.where('g.academic_year_id', filters.academic_year_id);
    }
    if (filters.is_published !== undefined) {
      query.where('g.is_published', filters.is_published);
    }
    if (filters.class_id) {
      query.where('s.class_id', filters.class_id);
    }

    return query;
  }

  // ================================
  // CRÉER UNE NOTE
  // ================================
  static async create(
    schemaName: string,
    data: {
      student_id: string;
      subject_id: string;
      teacher_id?: string;
      academic_year_id: string;
      value: number;
      max_value?: number;
      coefficient?: number;
      type?: string;
      term: number;
      title?: string;
      comment?: string;
    },
  ) {
    const db = getTenantDb(schemaName);

    if (data.value < 0 || data.value > (data.max_value || 20)) {
      throw {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: `La note doit être entre 0 et ${data.max_value || 20}`,
        status: 400,
      };
    }

    const [grade] = await db('grades').insert(data).returning('*');
    return grade;
  }

  // ================================
  // MODIFIER UNE NOTE
  // ================================
  static async update(schemaName: string, id: string, data: any) {
    const db = getTenantDb(schemaName);
    const [grade] = await db('grades')
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');

    if (!grade) {
      throw { code: ERROR_CODES.GRADE_NOT_FOUND, status: 404 };
    }
    return grade;
  }

  // ================================
  // SUPPRIMER UNE NOTE
  // ================================
  static async delete(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    await db('grades').where({ id }).delete();
  }

  // ================================
  // PUBLIER LES NOTES D'UN TERME
  // ================================
  static async publishTerm(
    schemaName: string,
    term: number,
    academicYearId: string,
  ) {
    const db = getTenantDb(schemaName);
    await db('grades')
      .where({ term, academic_year_id: academicYearId })
      .update({ is_published: true, updated_at: new Date() });
  }

  // ================================
  // CALCULER LA MOYENNE D'UN ÉLÈVE
  // ================================
  static async getStudentAverage(
    schemaName: string,
    studentId: string,
    term: number,
    academicYearId: string,
  ) {
    const db = getTenantDb(schemaName);

    const grades = await db('grades as g')
      .join('subjects as s', 'g.subject_id', 's.id')
      .where({
        'g.student_id': studentId,
        'g.term': term,
        'g.academic_year_id': academicYearId,
      })
      .select(
        'g.value',
        'g.max_value',
        'g.coefficient',
        's.name as subject_name',
        's.color as subject_color',
      );

    if (grades.length === 0) return null;

    // Calcul moyenne pondérée sur 20
    let totalWeighted = 0;
    let totalCoeff = 0;

    grades.forEach((g: any) => {
      const normalized = (g.value / g.max_value) * 20;
      totalWeighted += normalized * g.coefficient;
      totalCoeff += g.coefficient;
    });

    const average =
      totalCoeff > 0 ? Math.round((totalWeighted / totalCoeff) * 100) / 100 : 0;

    return { average, grades, total_subjects: grades.length };
  }

  // ================================
  // GÉNÉRER LE BULLETIN D'UN ÉLÈVE
  // ================================
  static async generateReportCard(
    schemaName: string,
    studentId: string,
    term: number,
    academicYearId: string,
  ) {
    const db = getTenantDb(schemaName);

    // Récupérer les infos de l'élève
    const student = await db('students as s')
      .join('users as u', 's.user_id', 'u.id')
      .leftJoin('classes as c', 's.class_id', 'c.id')
      .where('s.id', studentId)
      .select(
        's.id',
        's.student_code',
        'u.first_name',
        'u.last_name',
        'c.name as class_name',
      )
      .first();

    if (!student) {
      throw { code: ERROR_CODES.STUDENT_NOT_FOUND, status: 404 };
    }

    // Calculer la moyenne
    const result = await this.getStudentAverage(
      schemaName,
      studentId,
      term,
      academicYearId,
    );

    if (!result) {
      throw {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Aucune note pour ce trimestre',
        status: 400,
      };
    }

    // Calculer le rang dans la classe
    const classStudents = await db('students')
      .where({
        class_id: db('students')
          .where({ id: studentId })
          .select('class_id')
          .first() as any,
      })
      .select('id');

    let rank = 1;
    let totalStudents = 0;

    for (const cs of classStudents) {
      const csResult = await this.getStudentAverage(
        schemaName,
        cs.id,
        term,
        academicYearId,
      );
      if (csResult) {
        totalStudents++;
        if (csResult.average > result.average) rank++;
      }
    }

    // Sauvegarder ou mettre à jour le bulletin
    const existing = await db('report_cards')
      .where({ student_id: studentId, term, academic_year_id: academicYearId })
      .first();

    const reportData = {
      student_id: studentId,
      term,
      academic_year_id: academicYearId,
      average: result.average,
      rank,
      total_students: totalStudents,
      updated_at: new Date(),
    };

    let reportCard;
    if (existing) {
      [reportCard] = await db('report_cards')
        .where({ id: existing.id })
        .update(reportData)
        .returning('*');
    } else {
      [reportCard] = await db('report_cards').insert(reportData).returning('*');
    }

    return {
      ...reportCard,
      student,
      grades: result.grades,
    };
  }

  // ================================
  // RÉCUPÉRER LES BULLETINS D'UNE CLASSE
  // ================================
  static async getClassReportCards(
    schemaName: string,
    classId: string,
    term: number,
    academicYearId: string,
  ) {
    const db = getTenantDb(schemaName);

    const students = await db('students as s')
      .join('users as u', 's.user_id', 'u.id')
      .where({ 's.class_id': classId, 's.enrollment_status': 'active' })
      .select('s.id', 'u.first_name', 'u.last_name', 's.student_code')
      .orderBy('u.last_name');

    const reportCards = await Promise.all(
      students.map(async (student: any) => {
        // Récupérer les notes directement
        const grades = await db('grades as g')
          .where({
            'g.student_id': student.id,
            'g.term': term,
            'g.academic_year_id': academicYearId,
          })
          .select('g.value', 'g.max_value', 'g.coefficient');

        // Calculer la moyenne
        let average = null;
        if (grades.length > 0) {
          let totalWeighted = 0;
          let totalCoeff = 0;
          grades.forEach((g: any) => {
            const normalized = (g.value / g.max_value) * 20;
            totalWeighted += normalized * Number(g.coefficient);
            totalCoeff += Number(g.coefficient);
          });
          average =
            totalCoeff > 0
              ? Math.round((totalWeighted / totalCoeff) * 100) / 100
              : 0;
        }

        // Récupérer le bulletin s'il existe
        const reportCard = await db('report_cards')
          .where({
            student_id: student.id,
            term,
            academic_year_id: academicYearId,
          })
          .first();

        return {
          student,
          average,
          rank: reportCard?.rank || null,
          total_subjects: grades.length,
          is_generated: !!reportCard,
        };
      }),
    );

    // Trier par moyenne décroissante
    return reportCards.sort((a, b) => (b.average || 0) - (a.average || 0));
  }
}
