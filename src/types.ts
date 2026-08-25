export type Gender = 'Male' | 'Female';

/* =====================================================
   CLASS
===================================================== */

export interface ClassRoom {
  id: string;
  name: string;
  grade: string;
  academicYear: string;
}

/* =====================================================
   STUDENT EDUCATIONAL TYPES
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
  | 'Active'
  | 'Average'
  | 'Quiet'
  | 'Needs encouragement';

export type LearningBehaviour =
  | 'Independent'
  | 'Needs guidance'
  | 'Easily distracted'
  | 'Consistent'
  | 'Mixed';

export type MotivationLevel =
  | 'High'
  | 'Good'
  | 'Average'
  | 'Low'
  | 'Unknown';

export type SkillLevel =
  | 'Strong'
  | 'Good'
  | 'Developing'
  | 'Needs Support'
  | 'Not assessed';

export type FamilySupport =
  | 'Strong'
  | 'Good'
  | 'Limited'
  | 'Unknown';

export type HomeLearningEnvironment =
  | 'Supportive'
  | 'Adequate'
  | 'Limited'
  | 'Unknown';

export type ResourceAccess =
  | 'Good'
  | 'Limited'
  | 'None'
  | 'Unknown';

export type DifficultyLevel =
  | 'No issue'
  | 'Sometimes difficult'
  | 'Significant difficulty'
  | 'Unknown';

export type AttendancePattern =
  | 'Regular'
  | 'Occasional absences'
  | 'Frequent absences'
  | 'Unknown';

export type AccommodationStatus =
  | 'None'
  | 'Not known'
  | 'Yes';

/* =====================================================
   CLASSROOM OBSERVATION
===================================================== */

export type ClassroomBehaviour =
  | 'Excellent'
  | 'Good'
  | 'Average'
  | 'Needs improvement';

export type AttentionLevel =
  | 'Focused'
  | 'Usually focused'
  | 'Sometimes distracted'
  | 'Frequently distracted';

export type HomeworkCompletion =
  | 'Always'
  | 'Usually'
  | 'Sometimes'
  | 'Rarely';

export type PunctualityLevel =
  | 'Always on time'
  | 'Usually on time'
  | 'Sometimes late'
  | 'Frequently late';

export type PeerInteraction =
  | 'Excellent'
  | 'Good'
  | 'Average'
  | 'Needs support';

export type TeacherInteraction =
  | 'Excellent'
  | 'Good'
  | 'Average'
  | 'Needs encouragement';

/* =====================================================
   STUDENT SUPPORT
===================================================== */

export type FamilyFollowUp =
  | 'Not needed'
  | 'Occasional'
  | 'Regular'
  | 'Required';

export type SupportRequired =
  | 'None'
  | 'Academic'
  | 'Behavioural'
  | 'Social'
  | 'Multiple areas';

export type HealthConsideration =
  | 'None'
  | 'Known consideration'
  | 'Requires attention';

/* =====================================================
   STUDENT
===================================================== */

export interface Student {
  id: string;

  /* Basic information */
  massarCode: string;
  name: string;
  nameAr?: string;
  dateOfBirth?: string;
  classId: string;
  gender: Gender;

  /* Educational profile */
  learningStyle?: LearningStyle;
  learningPreference?: LearningPreference;
  participationLevel?: ParticipationLevel;
  learningBehaviour?: LearningBehaviour;
  motivationLevel?: MotivationLevel;

  strengths?: string;
  areasForImprovement?: string;
  learningNeeds?: string;
  educationalGoals?: string;
  educationalNotes?: string;

  /* Language */
  firstLanguage?: string;
  otherLanguages?: string;

  englishLevel?: SkillLevel;
  speakingLevel?: SkillLevel;
  listeningLevel?: SkillLevel;
  readingLevel?: SkillLevel;
  writingLevel?: SkillLevel;
  vocabularyLevel?: SkillLevel;
  grammarLevel?: SkillLevel;
  pronunciationLevel?: SkillLevel;

  /* Classroom behaviour */
  classroomBehaviour?: ClassroomBehaviour;
  attentionLevel?: AttentionLevel;
  homeworkCompletion?: HomeworkCompletion;
  punctuality?: PunctualityLevel;
  peerInteraction?: PeerInteraction;
  teacherInteraction?: TeacherInteraction;
  behaviourNotes?: string;

  /* Attendance */
  attendancePattern?: AttendancePattern;
  frequentLateness?: boolean;
  engagementLevel?: ParticipationLevel;
  absenceReason?: string;
  engagementNotes?: string;

  /* Social / family context */
  livingArrangement?: string;
  familySupport?: FamilySupport;
  homeLearningEnvironment?: HomeLearningEnvironment;
  accessToLearningResources?: ResourceAccess;
  transportationDifficulty?: DifficultyLevel;

  familyFollowUp?: FamilyFollowUp;
  socialSupport?: string;
  socialEducationalNotes?: string;

  /* Health / educational support */
  healthConsideration?: HealthConsideration;
  healthNotes?: string;
  specialEducationalNeeds?: AccommodationStatus;
  learningAccommodationNeeded?: AccommodationStatus;
  accessibilityNeeds?: string;

  supportRequired?: SupportRequired;
  supportNotes?: string;

  /* Interests */
  interests?: string;
  hobbies?: string;
  favouriteTopics?: string;
  motivationFactors?: string;
  careerInterests?: string;
  preferredActivities?: string;

  /* Teacher support plan */
  recommendedSupport?: string;
  interventionNeeded?: string;
  effectiveStrategies?: string;
  strategiesToAvoid?: string;

  shortTermGoal?: string;
  followUpDate?: string;
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
   STUDENT ANALYTICS
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