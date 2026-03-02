// ================================
// Permissions par rôle
// ================================

export const PERMISSIONS = {
  // Users
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',

  // Grades
  GRADES_READ: 'grades:read',
  GRADES_WRITE: 'grades:write',
  GRADES_DELETE: 'grades:delete',
  GRADES_PUBLISH: 'grades:publish',

  // Attendance
  ATTENDANCE_READ: 'attendance:read',
  ATTENDANCE_WRITE: 'attendance:write',

  // Finance
  FINANCE_READ: 'finance:read',
  FINANCE_WRITE: 'finance:write',
  FINANCE_REPORTS: 'finance:reports',

  // Reports
  REPORTS_READ: 'reports:read',
  REPORTS_GENERATE: 'reports:generate',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',

  // Students
  STUDENTS_READ: 'students:read',
  STUDENTS_WRITE: 'students:write',
  STUDENTS_DELETE: 'students:delete',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Permissions par rôle
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.GRADES_READ,
    PERMISSIONS.GRADES_WRITE,
    PERMISSIONS.GRADES_DELETE,
    PERMISSIONS.GRADES_PUBLISH,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_WRITE,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.FINANCE_WRITE,
    PERMISSIONS.FINANCE_REPORTS,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_WRITE,
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.STUDENTS_WRITE,
    PERMISSIONS.STUDENTS_DELETE,
  ],
  teacher: [
    PERMISSIONS.GRADES_READ,
    PERMISSIONS.GRADES_WRITE,
    PERMISSIONS.GRADES_PUBLISH,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_WRITE,
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.REPORTS_READ,
  ],
  accountant: [
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.FINANCE_WRITE,
    PERMISSIONS.FINANCE_REPORTS,
    PERMISSIONS.STUDENTS_READ,
  ],
  parent: [
    PERMISSIONS.GRADES_READ,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.FINANCE_READ,
  ],
  student: [PERMISSIONS.GRADES_READ, PERMISSIONS.ATTENDANCE_READ],
  librarian: [PERMISSIONS.STUDENTS_READ],
};
