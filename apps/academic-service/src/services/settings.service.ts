import { getTenantDb } from '../config/database';

export class SettingsService {

  static async getAll(schemaName: string) {
    const db = getTenantDb(schemaName);
    const rows = await db('school_settings').orderBy('category').orderBy('key');
    // Transformer en objet groupé par catégorie
    const grouped: Record<string, Record<string, string>> = {};
    for (const row of rows) {
      if (!grouped[row.category]) grouped[row.category] = {};
      grouped[row.category][row.key] = row.value ?? '';
    }
    return grouped;
  }

  static async getFlat(schemaName: string) {
    const db = getTenantDb(schemaName);
    const rows = await db('school_settings').orderBy('key');
    const flat: Record<string, string> = {};
    for (const row of rows) {
      flat[row.key] = row.value ?? '';
    }
    return flat;
  }

  static async updateMany(schemaName: string, updates: Record<string, string>) {
    const db = getTenantDb(schemaName);
    for (const [key, value] of Object.entries(updates)) {
      await db('school_settings')
        .where({ key })
        .update({ value, updated_at: db.fn.now() });
    }
    return this.getFlat(schemaName);
  }

  static async get(schemaName: string, key: string) {
    const db = getTenantDb(schemaName);
    const row = await db('school_settings').where({ key }).first();
    return row?.value ?? null;
  }
}
