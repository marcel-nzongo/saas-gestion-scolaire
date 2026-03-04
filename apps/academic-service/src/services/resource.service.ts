import { getTenantDb } from '../config/database';
import fs from 'fs';
import path from 'path';

export class ResourceService {

  static async getAll(schemaName: string, filters: {
  class_id?: string;
  subject_id?: string;
  academic_year_id?: string;
  teacher_id?: string;
  type?: string;
}) {
  const db = getTenantDb(schemaName);

  const query = db('resources as r')
    .leftJoin('teachers as t', 'r.teacher_id', 't.id')
    .leftJoin('users as u', 't.user_id', 'u.id')
    .leftJoin('classes as c', 'r.class_id', 'c.id')
    .leftJoin('subjects as s', 'r.subject_id', 's.id')
    .where('r.is_published', true)
    .select(
      'r.*',
      'u.first_name as teacher_first_name',
      'u.last_name as teacher_last_name',
      'c.name as class_name',
      's.name as subject_name',
      's.color as subject_color',
    )
    .orderBy('r.created_at', 'desc');

  if (filters.class_id) query.where('r.class_id', filters.class_id);
  if (filters.subject_id) query.where('r.subject_id', filters.subject_id);
  if (filters.academic_year_id) query.where('r.academic_year_id', filters.academic_year_id);
  if (filters.teacher_id) query.where('r.teacher_id', filters.teacher_id);
  if (filters.type) query.where('r.type', filters.type);

  return query;
}

  static async create(schemaName: string, data: {
    teacher_id: string;
    class_id: string;
    subject_id: string;
    academic_year_id: string;
    title: string;
    description?: string;
    type: string;
    file_url?: string;
    file_name?: string;
    file_size?: number;
  }) {
    const db = getTenantDb(schemaName);
    const [resource] = await db('resources').insert(data).returning('*');
    return resource;
  }

  static async delete(schemaName: string, id: string, teacherId: string) {
    const db = getTenantDb(schemaName);
    const resource = await db('resources')
      .where({ id, teacher_id: teacherId })
      .first();

    if (!resource) throw { code: 'RESOURCE_NOT_FOUND', status: 404 };

    // Supprimer le fichier physique
    if (resource.file_url) {
      const filePath = path.resolve(__dirname, '../../uploads', path.basename(resource.file_url));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await db('resources').where({ id }).delete();
  }

  // FORUM
  static async getTopics(schemaName: string, filters: {
    class_id: string;
    subject_id: string;
    academic_year_id: string;
  }) {
    const db = getTenantDb(schemaName);
    return db('forum_topics as ft')
      .join('users as u', 'ft.author_id', 'u.id')
      .where({
        'ft.class_id': filters.class_id,
        'ft.subject_id': filters.subject_id,
        'ft.academic_year_id': filters.academic_year_id,
      })
      .select(
        'ft.*',
        'u.first_name as author_first_name',
        'u.last_name as author_last_name',
        'u.role as author_role',
      )
      .orderBy([
        { column: 'ft.is_pinned', order: 'desc' },
        { column: 'ft.created_at', order: 'desc' },
      ]);
  }

  static async createTopic(schemaName: string, data: {
    class_id: string;
    subject_id: string;
    academic_year_id: string;
    author_id: string;
    title: string;
    content: string;
    is_pinned?: boolean;
  }) {
    const db = getTenantDb(schemaName);
    const [topic] = await db('forum_topics').insert(data).returning('*');
    return topic;
  }

  static async getReplies(schemaName: string, topicId: string) {
    const db = getTenantDb(schemaName);
    return db('forum_replies as fr')
      .join('users as u', 'fr.author_id', 'u.id')
      .where('fr.topic_id', topicId)
      .select(
        'fr.*',
        'u.first_name as author_first_name',
        'u.last_name as author_last_name',
        'u.role as author_role',
      )
      .orderBy('fr.created_at', 'asc');
  }

  static async createReply(schemaName: string, data: {
    topic_id: string;
    author_id: string;
    content: string;
  }) {
    const db = getTenantDb(schemaName);
    const [reply] = await db('forum_replies').insert(data).returning('*');
    return reply;
  }

  static async deleteTopic(schemaName: string, id: string) {
    const db = getTenantDb(schemaName);
    await db('forum_topics').where({ id }).delete();
  }
}