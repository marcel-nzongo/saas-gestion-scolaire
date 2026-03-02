// ================================
// Types liés à l'académique
// ================================

export type GradingSystem = '20' | '100' | 'GPA' | 'letter';
export type GradeType = 'exam' | 'quiz' | 'homework' | 'project' | 'oral';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type EnrollmentStatus =
  | 'active'
  | 'graduated'
  | 'dropped'
  | 'transferred';

export interface AcademicYear {
  id: string;
  name: string;
  start_date: Date;
  end_date: Date;
  is_current: boolean;
  grading_system: GradingSystem;
  terms: Term[];
}

export interface Term {
  number: number;
  name: string;
  start_date: string;
  end_date: string;
}

export interface Class {
  id: string;
  name: string;
  academic_year_id: string;
  teacher_id?: string;
  level?: string;
  section?: string;
  max_capacity: number;
  room?: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  color: string;
  default_coefficient: number;
  is_active: boolean;
}

export interface Student {
  id: string;
  user_id: string;
  student_code?: string;
  class_id?: string;
  enrollment_date?: Date;
  enrollment_status: EnrollmentStatus;
  scholarship_type?: string;
}

export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  teacher_id?: string;
  academic_year_id: string;
  value: number;
  max_value: number;
  coefficient: number;
  type: GradeType;
  term: number;
  title?: string;
  comment?: string;
  is_published: boolean;
  graded_at: Date;
}

export interface Attendance {
  id: string;
  student_id: string;
  date: Date;
  status: AttendanceStatus;
  justification?: string;
  justified_at?: Date;
  recorded_by?: string;
}

export interface ReportCard {
  id: string;
  student_id: string;
  term: number;
  academic_year_id: string;
  average?: number;
  rank?: number;
  total_students?: number;
  teacher_comment?: string;
  principal_comment?: string;
  pdf_url?: string;
  published_at?: Date;
}
