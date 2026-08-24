export type Gender = 'Male' | 'Female';

export interface ClassRoom {
  id: string;
  name: string;
  grade: string;
  academicYear: string;
}

/* =====================================================
   EDUCATIONAL OPTIONS
   ===================================================== */

export type LearningStyle =
  | 'Visual'
  | 'Auditory'
  | 'Reading/Writing'
  | 'Kinesthetic'
  | 'Mixed'
  | 'Not identified';

export type LearningPreference =
  | 'Individual work'
  | 'Pair work'
  | 'Group work'
  | 'Mixed';

export type ParticipationLevel =
  | 'Very active'
  | 'Active'
  | 'Sometimes participates'
  | 'Rarely participates'
  | 'Passive';

export type LearningBehaviour =
  | 'Independent'
  | 'Needs guidance'
  | 'Easily distracted'
  | 'Consistent'
  | 'Mixed';

export type MotivationLevel =
  | 'Highly motivated'
  | 'Motivated'
  | 'Inconsistent'
  | 'Low motivation'
  | 'Unknown';

export type SkillLevel =
  | 'Strong'
  | 'Good'
  | 'Developing'
  | 'Needs support'
  | 'Not assessed';

export type ClassroomBehaviour =
  | 'Excellent'
  | 'Good'
  | 'Generally good'
  | 'Needs monitoring'
  | 'Frequent difficulties';

export type AttentionLevel =
  | 'Focused'
  | 'Usually focused'
  | 'Easily distracted'
  | 'Needs frequent reminders';

export type FamilyFollowUp =
  | 'Good'
  | 'Occasional'
  | 'Limited'
  | 'Unknown';

export type SupportRequired =
  | 'None'
  | 'Academic support'
  | 'Behavioural support'
  | 'Individual attention'
  | 'Parental follow-up'
  | 'Regular monitoring';

export type HealthConsideration =
  | 'None'
  | 'Vision'
  | 'Hearing'
  | 'Mobility'
  | 'Medical consideration'
  | 'Other'
  | 'Not provided';

/* =====================================================
   STUDENT
   ===================================================== */

export interface Student {
  id: string;
  massarCode: string;
  name: string;
  nameAr?: string;
  dateOfBirth?: string;
  classId: string;
  gender: Gender;

  /*
   * EDUCATIONAL PROFILE
   */

  learningStyle?: LearningStyle;
  learningPreference?: LearningPreference;
  participationLevel?: ParticipationLevel;
  learningBehaviour?: LearningBehaviour;
  motivationLevel?: MotivationLevel;

  learningNeeds?: string;
  strengths?: string;
  areasForImprovement?: string;

  /*
   * CLASSROOM BEHAVIOUR
   */

  classroomBehaviour?: ClassroomBehaviour;
  attentionLevel?: AttentionLevel;

  /*
   * LANGUAGE & SKILLS
   */

  englishLevel?: SkillLevel;
  speakingLevel?: SkillLevel;
  listeningLevel?: SkillLevel;
  readingLevel?: SkillLevel;
  writingLevel?: SkillLevel;

  /*
   * INTERESTS
   */

  interests?: string;
  favouriteTopics?: string;

  /*
   * SOCIAL / FAMILY
   */

  familyFollowUp?: FamilyFollowUp;
  socialSupport?: SupportRequired;

  /*
   * HEALTH / SUPPORT
   */

  healthConsideration?: HealthConsideration;
  healthNotes?: string;
  supportRequired?: SupportRequired;

  /*
   * TEACHER NOTES
   */

  teacherNotes?: string;
}

/* =====================================================
   ATTENDANCE
   ===================================================== */

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

/* =====================================================
   TERMS
   ===================================================== */

export type Term =
  | 'First Term'
  | 'Second Term';

/* =====================================================
   ASSESSMENTS
   ===================================================== */

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

/* =====================================================
   INTEGRATED ACTIVITIES
   ===================================================== */

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

/* =====================================================
   APP DATA
   ===================================================== */

export interface AppData {
  schoolName?: string;
  teacherName?: string;

  classes: ClassRoom[];
  students: Student[];
  attendance: AttendanceRecord[];
  assessments: AssessmentRecord[];
  integratedActivities: IntegratedActivityRecord[];
}

/* =====================================================
   STUDENT SUMMARY
   ===================================================== */

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