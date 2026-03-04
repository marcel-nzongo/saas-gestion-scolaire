import { Request, Response } from 'express';
import { ResourceService } from '../services/resource.service';
import { TeacherService } from '../services/teacher.service';
import path from 'path';

const getSchema = (req: Request) => (req as any).user?.tsc || 'tenant_test';
const getUserId = (req: Request) => (req as any).user?.sub;

export class ResourceController {

  static async getAll(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const { class_id, subject_id, academic_year_id, type } = req.query;
      const resources = await ResourceService.getAll(schema, {
        class_id: class_id as string,
        subject_id: subject_id as string,
        academic_year_id: academic_year_id as string,
        type: type as string,
      });
      res.json({ success: true, data: resources });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async upload(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const userId = getUserId(req);
      const teacher = await TeacherService.getByUserId(schema, userId);
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE' },
        });
      }

      const { class_id, subject_id, academic_year_id, title, description } = req.body;
      const type = file.mimetype === 'application/pdf' ? 'pdf' : 'video';
      const fileUrl = `/uploads/${file.filename}`;

      const resource = await ResourceService.create(schema, {
        teacher_id: teacher.id,
        class_id,
        subject_id,
        academic_year_id,
        title,
        description,
        type,
        file_url: fileUrl,
        file_name: file.originalname,
        file_size: file.size,
      });

      res.status(201).json({ success: true, data: resource });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const userId = getUserId(req);
      const teacher = await TeacherService.getByUserId(schema, userId);
      await ResourceService.delete(schema, req.params.id, teacher.id);
      res.json({ success: true, message: 'Ressource supprimée' });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, error });
    }
  }

  // FORUM
  static async getTopics(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const { class_id, subject_id, academic_year_id } = req.query;
      const topics = await ResourceService.getTopics(schema, {
        class_id: class_id as string,
        subject_id: subject_id as string,
        academic_year_id: academic_year_id as string,
      });
      res.json({ success: true, data: topics });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async createTopic(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const userId = getUserId(req);
      const topic = await ResourceService.createTopic(schema, {
        ...req.body,
        author_id: userId,
      });
      res.status(201).json({ success: true, data: topic });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async getReplies(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const replies = await ResourceService.getReplies(schema, req.params.topicId);
      res.json({ success: true, data: replies });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async createReply(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const userId = getUserId(req);
      const reply = await ResourceService.createReply(schema, {
        topic_id: req.params.topicId,
        author_id: userId,
        content: req.body.content,
      });
      res.status(201).json({ success: true, data: reply });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async deleteTopic(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      await ResourceService.deleteTopic(schema, req.params.id);
      res.json({ success: true, message: 'Topic supprimé' });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }
}