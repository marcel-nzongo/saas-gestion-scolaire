import axios from 'axios';
import Cookies from 'js-cookie';

const ACADEMIC_URL =
  process.env.NEXT_PUBLIC_ACADEMIC_URL || 'http://localhost:3002/api/v1';

export const academicApi = axios.create({
  baseURL: ACADEMIC_URL,
  headers: { 'Content-Type': 'application/json' },
});

academicApi.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface Student {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  class_name?: string;
  class_id?: string;
  enrollment_status: string;
  avatar_url?: string;
}

export interface Class {
  id: string;
  name: string;
  level?: string;
  section?: string;
  max_capacity: number;
  room?: string;
  teacher_name?: string;
  academic_year_name?: string;
  student_count?: number;
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

// API calls
export const studentApi = {
  getAll: (params?: any) => academicApi.get('/students', { params }),
  getById: (id: string) => academicApi.get(`/students/${id}`),
  create: (data: any) => academicApi.post('/students', data),
  update: (id: string, data: any) => academicApi.put(`/students/${id}`, data),
  delete: (id: string) => academicApi.delete(`/students/${id}`),
};

export const classApi = {
  getAll: (params?: any) => academicApi.get('/classes', { params }),
  getById: (id: string) => academicApi.get(`/classes/${id}`),
  getStudents: (id: string) => academicApi.get(`/classes/${id}/students`),
  create: (data: any) => academicApi.post('/classes', data),
  update: (id: string, data: any) => academicApi.put(`/classes/${id}`, data),
  delete: (id: string) => academicApi.delete(`/classes/${id}`),
};

export const academicYearApi = {
  getAll: () => academicApi.get('/academic-years'),
  getCurrent: () => academicApi.get('/academic-years/current'),
  create: (data: any) => academicApi.post('/academic-years', data),
};
export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  value: number;
  max_value: number;
  coefficient: number;
  type: string;
  term: number;
  title?: string;
  comment?: string;
  is_published: boolean;
  first_name: string;
  last_name: string;
  subject_name: string;
  subject_color: string;
  graded_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  color: string;
  default_coefficient: number;
}

export const gradeApi = {
  getAll: (params?: any) => academicApi.get('/grades', { params }),
  create: (data: any) => academicApi.post('/grades', data),
  update: (id: string, data: any) => academicApi.put(`/grades/${id}`, data),
  delete: (id: string) => academicApi.delete(`/grades/${id}`),
  getStudentAverage: (studentId: string, params: any) =>
    academicApi.get(`/grades/student/${studentId}/average`, { params }),
  generateReportCard: (studentId: string, data: any) =>
    academicApi.post(`/grades/student/${studentId}/report-card`, data),
  getClassReportCards: (classId: string, params: any) =>
    academicApi.get(`/grades/class/${classId}/report-cards`, { params }),
  publishTerm: (data: any) => academicApi.post('/grades/publish', data),
};

export const subjectApi = {
  getAll: () => academicApi.get('/subjects'),
};
