export type Gender = 'Male' | 'Female';

export interface ClassRoom {
  id: string;
  name: string;
  grade: string;
  academicYear: string;
}

export interface Student {
  id: string;
  name: string;

  /*
   * Arabic name used in official reports.
   * Optional so old students/data do not break.
   */
  nameAr?: string;

  /*
   * Date of birth.
   * Stored as YYYY-MM-DD.
   */
  dateOfBirth?: string;

  classId: string;
  gender: Gender;
}

export type AttendanceStatus =
  | 'Present'
  | 'Late'
  | 'Absent';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
}

export type Term =
  | 'First Term'
  | 'Second Term';

export type OfficialAssessment =
  | 'Quiz 1'
  | 'Quiz 2'
  | 'Global Test';

export type AssessmentType =
  | 'Quiz'
  | 'Test'
  | 'Homework'
  | 'Project'
  | 'Other';

export interface AssessmentRecord {
  id: string;
  studentId: string;
  classId: string;
  academicYear: string;
  date: string;
  name: OfficialAssessment;
  type: AssessmentType;
  term: Term;
  score: number;
  maxScore: number;
}

export interface IntegratedActivityRecord {
  id: string;
  studentId: string;
  classId: string;
  academicYear: string;
  term: Term;
  date: string;
  discipline: number;
  participation: number;
  copybook: number;
  projects: number;
  total: number;
}

export interface AppData {
  classes: ClassRoom[];
  students: Student[];
  attendance: AttendanceRecord[];
  assessments: AssessmentRecord[];
  integratedActivities: IntegratedActivityRecord[];
}

export type Progress =
  | 'Improving'
  | 'Stable'
  | 'Declining'
  | 'Not enough data';

export type Status =
  | 'Good'
  | 'Monitor'
  | 'Attention';

export interface StudentSummary {
  totalSessions: number;
  present: number;
  late: number;
  absent: number;
  attendanceRate: number;
  attendanceConcern: boolean;
  averageScore: number | null;
  progress: Progress;
  progressConcern: boolean;
  status: Status;
}