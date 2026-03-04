import { getTenantDb } from '../config/database';
import { ERROR_CODES } from '@educore/shared';

export class AcademicYearService {
  static async getAll(schemaName: string) {
    const db = getTenantDb(schemaName);
    return db('academic_years').orderBy('start_date', 'desc');
  }

  static async getCurrent(schemaName: string) {
    const db = getTenantDb(schemaName);
    return db('academic_years').where({ is_current: true }).first();
  }

  static async create(
    schemaName: string,
    data: {
      name: string;
      start_date: string;
      end_date: string;
      grading_system?: string;
    },
  ) {
    const db = getTenantDb(schemaName);

    // Une seule année courante à la fois
    await db('academic_years').update({ is_current: false });

    const [year] = await db('academic_years')
      .insert({ ...data, is_current: true })
      .returning('*');

    return year;
  }
}
