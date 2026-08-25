import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  AppData,
  Student,
  ClassRoom,
  AttendanceRecord,
  AssessmentRecord,
  IntegratedActivityRecord,
} from '@/types';

import { supabase } from '@/lib/supabase';
import { demoData } from '@/lib/seed';

interface DataContextValue {
  data: AppData;

  setData: React.Dispatch<
    React.SetStateAction<AppData>
  >;

  importData: (
    incoming: AppData
  ) => Promise<void>;

  resetToDemo: () => Promise<void>;

  clearAll: () => Promise<void>;

  addStudent: (
    student: Student
  ) => Promise<void>;

  updateStudent: (
    student: Student
  ) => Promise<void>;

  deleteStudent: (
    studentId: string
  ) => Promise<void>;
}

const DataContext =
  createContext<DataContextValue | null>(null);

/* =====================================================
   DATABASE MAPPERS
===================================================== */

function studentToDb(
  student: Student,
  userId: string
) {
  return {
    id: student.id,
    user_id: userId,

    name: student.name,
    name_ar: student.nameAr ?? null,
    date_of_birth: student.dateOfBirth || null,
    class_id: student.classId,
    gender: student.gender,

    learning_style:
      student.learningStyle ?? null,
    learning_preference:
      student.learningPreference ?? null,
    participation_level:
      student.participationLevel ?? null,
    learning_behaviour:
      student.learningBehaviour ?? null,
    motivation_level:
      student.motivationLevel ?? null,

    strengths:
      student.strengths ?? null,
    areas_for_improvement:
      student.areasForImprovement ?? null,
    learning_needs:
      student.learningNeeds ?? null,
    educational_goals:
      student.educationalGoals ?? null,
    educational_notes:
      student.educationalNotes ?? null,

    first_language:
      student.firstLanguage ?? null,
    other_languages:
      student.otherLanguages ?? null,

    english_level:
      student.englishLevel ?? null,
    speaking_level:
      student.speakingLevel ?? null,
    listening_level:
      student.listeningLevel ?? null,
    reading_level:
      student.readingLevel ?? null,
    writing_level:
      student.writingLevel ?? null,
    vocabulary_level:
      student.vocabularyLevel ?? null,
    grammar_level:
      student.grammarLevel ?? null,
    pronunciation_level:
      student.pronunciationLevel ?? null,

    classroom_behaviour:
      student.classroomBehaviour ?? null,
    attention_level:
      student.attentionLevel ?? null,
    homework_completion:
      student.homeworkCompletion ?? null,
    punctuality:
      student.punctuality ?? null,
    peer_interaction:
      student.peerInteraction ?? null,
    teacher_interaction:
      student.teacherInteraction ?? null,
    behaviour_notes:
      student.behaviourNotes ?? null,

    attendance_pattern:
      student.attendancePattern ?? null,
    frequent_lateness:
      student.frequentLateness ?? false,
    engagement_level:
      student.engagementLevel ?? null,
    absence_reason:
      student.absenceReason ?? null,
    engagement_notes:
      student.engagementNotes ?? null,

    living_arrangement:
      student.livingArrangement ?? null,
    family_support:
      student.familySupport ?? null,
    home_learning_environment:
      student.homeLearningEnvironment ?? null,
    access_to_learning_resources:
      student.accessToLearningResources ?? null,
    transportation_difficulty:
      student.transportationDifficulty ?? null,
    family_follow_up:
      student.familyFollowUp ?? null,
    social_support:
      student.socialSupport ?? null,
    social_educational_notes:
      student.socialEducationalNotes ?? null,

    health_consideration:
      student.healthConsideration ?? null,
    health_notes:
      student.healthNotes ?? null,
    special_educational_needs:
      student.specialEducationalNeeds ?? null,
    learning_accommodation_needed:
      student.learningAccommodationNeeded ?? null,
    accessibility_needs:
      student.accessibilityNeeds ?? null,
    support_required:
      student.supportRequired ?? null,
    support_notes:
      student.supportNotes ?? null,

    interests:
      student.interests ?? null,
    hobbies:
      student.hobbies ?? null,
    favourite_topics:
      student.favouriteTopics ?? null,
    motivation_factors:
      student.motivationFactors ?? null,
    career_interests:
      student.careerInterests ?? null,
    preferred_activities:
      student.preferredActivities ?? null,

    recommended_support:
      student.recommendedSupport ?? null,
    intervention_needed:
      student.interventionNeeded ?? null,
    effective_strategies:
      student.effectiveStrategies ?? null,
    strategies_to_avoid:
      student.strategiesToAvoid ?? null,
    short_term_goal:
      student.shortTermGoal ?? null,
    follow_up_date:
      student.followUpDate || null,
    teacher_notes:
      student.teacherNotes ?? null,
  };
}

function studentFromDb(
  row: any
): Student {
  return {
    id: row.id,
    massarCode: row.id,
    name: row.name,
    nameAr: row.name_ar ?? undefined,
    dateOfBirth:
      row.date_of_birth ?? undefined,
    classId: row.class_id,
    gender: row.gender,

    learningStyle:
      row.learning_style ?? undefined,
    learningPreference:
      row.learning_preference ?? undefined,
    participationLevel:
      row.participation_level ?? undefined,
    learningBehaviour:
      row.learning_behaviour ?? undefined,
    motivationLevel:
      row.motivation_level ?? undefined,

    strengths:
      row.strengths ?? undefined,
    areasForImprovement:
      row.areas_for_improvement ?? undefined,
    learningNeeds:
      row.learning_needs ?? undefined,
    educationalGoals:
      row.educational_goals ?? undefined,
    educationalNotes:
      row.educational_notes ?? undefined,

    firstLanguage:
      row.first_language ?? undefined,
    otherLanguages:
      row.other_languages ?? undefined,

    englishLevel:
      row.english_level ?? undefined,
    speakingLevel:
      row.speaking_level ?? undefined,
    listeningLevel:
      row.listening_level ?? undefined,
    readingLevel:
      row.reading_level ?? undefined,
    writingLevel:
      row.writing_level ?? undefined,
    vocabularyLevel:
      row.vocabulary_level ?? undefined,
    grammarLevel:
      row.grammar_level ?? undefined,
    pronunciationLevel:
      row.pronunciation_level ?? undefined,

    classroomBehaviour:
      row.classroom_behaviour ?? undefined,
    attentionLevel:
      row.attention_level ?? undefined,
    homeworkCompletion:
      row.homework_completion ?? undefined,
    punctuality:
      row.punctuality ?? undefined,
    peerInteraction:
      row.peer_interaction ?? undefined,
    teacherInteraction:
      row.teacher_interaction ?? undefined,
    behaviourNotes:
      row.behaviour_notes ?? undefined,

    attendancePattern:
      row.attendance_pattern ?? undefined,
    frequentLateness:
      row.frequent_lateness ?? false,
    engagementLevel:
      row.engagement_level ?? undefined,
    absenceReason:
      row.absence_reason ?? undefined,
    engagementNotes:
      row.engagement_notes ?? undefined,

    livingArrangement:
      row.living_arrangement ?? undefined,
    familySupport:
      row.family_support ?? undefined,
    homeLearningEnvironment:
      row.home_learning_environment ?? undefined,
    accessToLearningResources:
      row.access_to_learning_resources ?? undefined,
    transportationDifficulty:
      row.transportation_difficulty ?? undefined,
    familyFollowUp:
      row.family_follow_up ?? undefined,
    socialSupport:
      row.social_support ?? undefined,
    socialEducationalNotes:
      row.social_educational_notes ?? undefined,

    healthConsideration:
      row.health_consideration ?? undefined,
    healthNotes:
      row.health_notes ?? undefined,
    specialEducationalNeeds:
      row.special_educational_needs ?? undefined,
    learningAccommodationNeeded:
      row.learning_accommodation_needed ?? undefined,
    accessibilityNeeds:
      row.accessibility_needs ?? undefined,
    supportRequired:
      row.support_required ?? undefined,
    supportNotes:
      row.support_notes ?? undefined,

    interests:
      row.interests ?? undefined,
    hobbies:
      row.hobbies ?? undefined,
    favouriteTopics:
      row.favourite_topics ?? undefined,
    motivationFactors:
      row.motivation_factors ?? undefined,
    careerInterests:
      row.career_interests ?? undefined,
    preferredActivities:
      row.preferred_activities ?? undefined,

    recommendedSupport:
      row.recommended_support ?? undefined,
    interventionNeeded:
      row.intervention_needed ?? undefined,
    effectiveStrategies:
      row.effective_strategies ?? undefined,
    strategiesToAvoid:
      row.strategies_to_avoid ?? undefined,
    shortTermGoal:
      row.short_term_goal ?? undefined,
    followUpDate:
      row.follow_up_date ?? undefined,
    teacherNotes:
      row.teacher_notes ?? undefined,
  };
}

/* =====================================================
   CLASS MAPPERS
===================================================== */

function classToDb(
  item: ClassRoom,
  userId: string
) {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    grade: item.grade,
    academic_year: item.academicYear,
  };
}

function classFromDb(
  row: any
): ClassRoom {
  return {
    id: row.id,
    name: row.name,
    grade: row.grade,
    academicYear:
      row.academic_year,
  };
}

/* =====================================================
   ATTENDANCE MAPPERS
===================================================== */

function attendanceToDb(
  item: AttendanceRecord,
  userId: string
) {
  return {
    id: item.id,
    user_id: userId,
    student_id: item.studentId,
    class_id: item.classId,
    date: item.date,
    status: item.status,
  };
}

function attendanceFromDb(
  row: any
): AttendanceRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    classId: row.class_id,
    date: row.date,
    status: row.status,
  };
}

/* =====================================================
   ASSESSMENT MAPPERS
===================================================== */

function assessmentToDb(
  item: AssessmentRecord,
  userId: string
) {
  return {
    id: item.id,
    user_id: userId,
    student_id: item.studentId,
    class_id: item.classId,
    academic_year: item.academicYear,
    date: item.date,
    name: item.name,
    type: item.type,
    term: item.term,
    score: item.score,
    max_score: item.maxScore,
  };
}

function assessmentFromDb(
  row: any
): AssessmentRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    classId: row.class_id,
    academicYear:
      row.academic_year,
    date: row.date,
    name: row.name,
    type: row.type,
    term: row.term,
    score: Number(row.score),
    maxScore: Number(row.max_score),
  };
}

/* =====================================================
   INTEGRATED ACTIVITY MAPPERS
===================================================== */

function activityToDb(
  item: IntegratedActivityRecord,
  userId: string
) {
  return {
    id: item.id,
    user_id: userId,
    student_id: item.studentId,
    class_id: item.classId,
    academic_year: item.academicYear,
    term: item.term,
    date: item.date,
    discipline: item.discipline,
    participation: item.participation,
    copybook: item.copybook,
    projects: item.projects,
    total: item.total,
  };
}

function activityFromDb(
  row: any
): IntegratedActivityRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    classId: row.class_id,
    academicYear:
      row.academic_year,
    term: row.term,
    date: row.date,
    discipline: Number(row.discipline),
    participation: Number(row.participation),
    copybook: Number(row.copybook),
    projects: Number(row.projects),
    total: Number(row.total),
  };
}

/* =====================================================
   EMPTY DATA
===================================================== */

function emptyData(): AppData {
  return {
    schoolName: '',
    teacherName: '',
    classes: [],
    students: [],
    attendance: [],
    assessments: [],
    integratedActivities: [],
  };
}

/* =====================================================
   LOAD FROM SUPABASE
===================================================== */

async function loadRemoteData(): Promise<AppData> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(
      'No authenticated user'
    );
  }

  const [
    classesResult,
    studentsResult,
    attendanceResult,
    assessmentsResult,
    activitiesResult,
  ] = await Promise.all([
    supabase
      .from('classes')
      .select('*')
      .eq('user_id', user.id),

    supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id),

    supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id),

    supabase
      .from('assessments')
      .select('*')
      .eq('user_id', user.id),

    supabase
      .from('integrated_activities')
      .select('*')
      .eq('user_id', user.id),
  ]);

  if (classesResult.error)
    throw classesResult.error;

  if (studentsResult.error)
    throw studentsResult.error;

  if (attendanceResult.error)
    throw attendanceResult.error;

  if (assessmentsResult.error)
    throw assessmentsResult.error;

  if (activitiesResult.error)
    throw activitiesResult.error;

  return {
    schoolName: '',
    teacherName: '',

    classes:
      (classesResult.data ?? [])
        .map(classFromDb),

    students:
      (studentsResult.data ?? [])
        .map(studentFromDb),

    attendance:
      (attendanceResult.data ?? [])
        .map(attendanceFromDb),

    assessments:
      (assessmentsResult.data ?? [])
        .map(assessmentFromDb),

    integratedActivities:
      (activitiesResult.data ?? [])
        .map(activityFromDb),
  };
}

/* =====================================================
   SAVE DATA
===================================================== */

async function saveRemoteData(
  data: AppData
) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error(
      'No authenticated user'
    );
  }

  const userId = user.id;

  const students =
    data.students.map(
      (item) =>
        studentToDb(item, userId)
    );

  const classes =
    data.classes.map(
      (item) =>
        classToDb(item, userId)
    );

  const attendance =
    data.attendance.map(
      (item) =>
        attendanceToDb(item, userId)
    );

  const assessments =
    data.assessments.map(
      (item) =>
        assessmentToDb(item, userId)
    );

  const activities =
    data.integratedActivities.map(
      (item) =>
        activityToDb(item, userId)
    );

  /* ===================================================
     EXISTING IDS
  =================================================== */

  const [
    existingStudents,
    existingClasses,
    existingAttendance,
    existingAssessments,
    existingActivities,
  ] = await Promise.all([
    supabase
      .from('students')
      .select('id')
      .eq('user_id', userId),

    supabase
      .from('classes')
      .select('id')
      .eq('user_id', userId),

    supabase
      .from('attendance')
      .select('id')
      .eq('user_id', userId),

    supabase
      .from('assessments')
      .select('id')
      .eq('user_id', userId),

    supabase
      .from('integrated_activities')
      .select('id')
      .eq('user_id', userId),
  ]);

  if (existingStudents.error)
    throw existingStudents.error;

  if (existingClasses.error)
    throw existingClasses.error;

  if (existingAttendance.error)
    throw existingAttendance.error;

  if (existingAssessments.error)
    throw existingAssessments.error;

  if (existingActivities.error)
    throw existingActivities.error;

  const current = {
    students:
      data.students.map(
        (x) => x.id
      ),

    classes:
      data.classes.map(
        (x) => x.id
      ),

    attendance:
      data.attendance.map(
        (x) => x.id
      ),

    assessments:
      data.assessments.map(
        (x) => x.id
      ),

    activities:
      data.integratedActivities.map(
        (x) => x.id
      ),
  };

  const studentIds =
    (existingStudents.data ?? [])
      .map((x) => x.id)
      .filter(
        (id) =>
          !current.students.includes(id)
      );

  const classIds =
    (existingClasses.data ?? [])
      .map((x) => x.id)
      .filter(
        (id) =>
          !current.classes.includes(id)
      );

  const attendanceIds =
    (existingAttendance.data ?? [])
      .map((x) => x.id)
      .filter(
        (id) =>
          !current.attendance.includes(id)
      );

  const assessmentIds =
    (existingAssessments.data ?? [])
      .map((x) => x.id)
      .filter(
        (id) =>
          !current.assessments.includes(id)
      );

  const activityIds =
    (existingActivities.data ?? [])
      .map((x) => x.id)
      .filter(
        (id) =>
          !current.activities.includes(id)
      );

  /* ===================================================
     DELETE REMOVED STUDENTS
  =================================================== */

  if (studentIds.length > 0) {
    const result =
      await supabase
        .from('students')
        .delete()
        .eq('user_id', userId)
        .in('id', studentIds);

    if (result.error)
      throw result.error;
  }

  /* ===================================================
     DELETE REMOVED CLASSES
  =================================================== */

  if (classIds.length > 0) {
    const result =
      await supabase
        .from('classes')
        .delete()
        .eq('user_id', userId)
        .in('id', classIds);

    if (result.error)
      throw result.error;
  }

  /* ===================================================
     DELETE REMOVED ATTENDANCE
  =================================================== */

  if (attendanceIds.length > 0) {
    const result =
      await supabase
        .from('attendance')
        .delete()
        .eq('user_id', userId)
        .in('id', attendanceIds);

    if (result.error)
      throw result.error;
  }

  /* ===================================================
     DELETE REMOVED ASSESSMENTS
  =================================================== */

  if (assessmentIds.length > 0) {
    const result =
      await supabase
        .from('assessments')
        .delete()
        .eq('user_id', userId)
        .in('id', assessmentIds);

    if (result.error)
      throw result.error;
  }

  /* ===================================================
     DELETE REMOVED ACTIVITIES
  =================================================== */

  if (activityIds.length > 0) {
    const result =
      await supabase
        .from('integrated_activities')
        .delete()
        .eq('user_id', userId)
        .in('id', activityIds);

    if (result.error)
      throw result.error;
  }

  /* ===================================================
     UPSERT STUDENTS
  =================================================== */

  if (students.length > 0) {
    const result =
      await supabase
        .from('students')
        .upsert(students);

    if (result.error)
      throw result.error;
  }

  /* ===================================================
     UPSERT CLASSES
  =================================================== */

  if (classes.length > 0) {
    const result =
      await supabase
        .from('classes')
        .upsert(classes);

    if (result.error)
      throw result.error;
  }

  /* ===================================================
     UPSERT ATTENDANCE
  =================================================== */

  if (attendance.length > 0) {
    const result =
      await supabase
        .from('attendance')
        .upsert(attendance);

    if (result.error)
      throw result.error;
  }

  /* ===================================================
     UPSERT ASSESSMENTS
  =================================================== */

  if (assessments.length > 0) {
    const result =
      await supabase
        .from('assessments')
        .upsert(assessments);

    if (result.error)
      throw result.error;
  }

  /* ===================================================
     UPSERT ACTIVITIES
  =================================================== */

  if (activities.length > 0) {
    const result =
      await supabase
        .from('integrated_activities')
        .upsert(activities);

    if (result.error)
      throw result.error;
  }
}

/* =====================================================
   DATA PROVIDER
===================================================== */

export function DataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setDataState] =
    useState<AppData>(
      emptyData()
    );

  const [loaded, setLoaded] =
    useState(false);

  /* ===================================================
     LOAD DATA
  =================================================== */

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const {
          data: { session },
        } =
          await supabase.auth.getSession();

        if (!session) {
          if (mounted) {
            setLoaded(true);
          }

          return;
        }

        const remote =
          await loadRemoteData();

        if (mounted) {
          setDataState(remote);
          setLoaded(true);
        }
      } catch (error) {
        console.error(
          'Failed to load Supabase data:',
          error
        );

        if (mounted) {
          setLoaded(true);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  /* ===================================================
     AUTO SYNC
  =================================================== */

  useEffect(() => {
    if (!loaded) return;

    async function sync() {
      try {
        await saveRemoteData(data);
      } catch (error) {
        console.error(
          'Failed to save Supabase data:',
          error
        );
      }
    }

    sync();
  }, [data, loaded]);

  /* ===================================================
     SET DATA
  =================================================== */

  const setData:
    React.Dispatch<
      React.SetStateAction<AppData>
    > = (value) => {
      setDataState(value);
    };

  /* ===================================================
     IMPORT DATA
  =================================================== */

  const importData = async (
    incoming: AppData
  ) => {
    setDataState(incoming);
  };

  /* ===================================================
     RESET DEMO
  =================================================== */

  const resetToDemo = async () => {
    const demo =
      demoData();

    setDataState(demo);
  };

  /* ===================================================
     CLEAR ALL
  =================================================== */

  const clearAll = async () => {
    setDataState(
      emptyData()
    );
  };

  /* ===================================================
     ADD STUDENT
  =================================================== */

  const addStudent = async (
    student: Student
  ) => {
    setDataState(
      (currentData) => ({
        ...currentData,

        students: [
          ...currentData.students,
          student,
        ],
      })
    );
  };

  /* ===================================================
     UPDATE STUDENT
  =================================================== */

  const updateStudent = async (
    student: Student
  ) => {
    setDataState(
      (currentData) => ({
        ...currentData,

        students:
          currentData.students.map(
            (existingStudent) =>
              existingStudent.id === student.id
                ? student
                : existingStudent
          ),
      })
    );
  };

  /* ===================================================
     DELETE STUDENT
  =================================================== */

  const deleteStudent = async (
    studentId: string
  ) => {
    setDataState(
      (currentData) => ({
        ...currentData,

        students:
          currentData.students.filter(
            (student) =>
              student.id !== studentId
          ),

        attendance:
          currentData.attendance.filter(
            (record) =>
              record.studentId !== studentId
          ),

        assessments:
          currentData.assessments.filter(
            (assessment) =>
              assessment.studentId !==
              studentId
          ),

        integratedActivities:
          currentData.integratedActivities.filter(
            (activity) =>
              activity.studentId !==
              studentId
          ),
      })
    );
  };

  /* ===================================================
     CONTEXT VALUE
  =================================================== */

  const value =
    useMemo<DataContextValue>(
      () => ({
        data,
        setData,
        importData,
        resetToDemo,
        clearAll,
        addStudent,
        updateStudent,
        deleteStudent,
      }),
      [data]
    );

  return (
    <DataContext.Provider
      value={value}
    >
      {children}
    </DataContext.Provider>
  );
}

/* =====================================================
   USE DATA
===================================================== */

export function useData() {
  const context =
    useContext(DataContext);

  if (!context) {
    throw new Error(
      'useData must be used within DataProvider'
    );
  }

  return context;
}