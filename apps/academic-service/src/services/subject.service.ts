import { getTenantDb } from '../config/database';

export class SubjectService {
  static async getAll(schemaName: string) {
    const db = getTenantDb(schemaName);
    return db('subjects').where({ is_active: true }).orderBy('name');
  }

  static async create(
    schemaName: string,
    data: {
      name: string;
      code?: string;
      color?: string;
      default_coefficient?: number;
    },
  ) {
    const db = getTenantDb(schemaName);
    const [subject] = await db('subjects').insert(data).returning('*');
    return subject;
  }

  static async update(schemaName: string, id: string, data: any) {
    const db = getTenantDb(schemaName);
    const [subject] = await db('subjects')
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return subject;
  }

  static async delete(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    await db('subjects')
      .where({ id })
      .update({ is_active: false, updated_at: new Date() });
  }
}
