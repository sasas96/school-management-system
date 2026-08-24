import { useMemo, useState } from 'react';

import { useData } from '@/store/DataContext';

import {
  getStudentAttendance,
  getStudentAssessments,
  averagePercentage,
  calcProgress,
  fmtPct,
  summarizeStudent,
} from '@/lib/calculations';

import {
  StatusBadge,
  ProgressBadge,
} from '@/components/Badges';

import {
  ArrowLeft,
  Pencil,
  Save,
  X,
} from 'lucide-react';

import type {
  Student,
  LearningStyle,
  LearningPreference,
  ParticipationLevel,
  LearningBehaviour,
  MotivationLevel,
  SkillLevel,
  ClassroomBehaviour,
  AttentionLevel,
  FamilyFollowUp,
  SupportRequired,
  HealthConsideration,
} from '@/types';


/* =====================================================
   STUDENT PROFILE
   ===================================================== */

export function StudentProfile({
  studentId,
  onBack,
}: {
  studentId: string;
  onBack: () => void;
}) {

  const {
    data,
    setData,
  } = useData();


  /* ===================================================
     STUDENT
     =================================================== */

  const student =
    data.students.find(
      (s) => s.id === studentId
    );


  /* ===================================================
     EDIT STATE
     =================================================== */

  const [editing, setEditing] =
    useState(false);

  const [form, setForm] =
    useState<Student | null>(null);


  /* ===================================================
     STUDENT NOT FOUND
     =================================================== */

  if (!student) {

    return (
      <div>

        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <p>
          Student not found.
        </p>

      </div>
    );
  }


  /* ===================================================
     ACTIVE FORM
     =================================================== */

  const current =
    form ?? student;


  /* ===================================================
     CLASS
     =================================================== */

  const cls =
    data.classes.find(
      (c) => c.id === student.classId
    );


  /* ===================================================
     ATTENDANCE
     =================================================== */

  const att =
    getStudentAttendance(
      data.attendance,
      student.id
    );


  /* ===================================================
     ASSESSMENTS
     =================================================== */

  const assessments =
    getStudentAssessments(
      data.assessments,
      student.id
    );


  /* ===================================================
     CALCULATIONS
     =================================================== */

  const avg =
    averagePercentage(
      assessments
    );

  const progress =
    calcProgress(
      assessments
    );

  const summary =
    summarizeStudent(
      student,
      data.attendance,
      data.assessments
    );


  /* ===================================================
     DISPLAY NAME
     =================================================== */

  const displayName =
    student.nameAr?.trim() ||
    student.name ||
    '—';


  /* ===================================================
     UPDATE FIELD
     =================================================== */

  const updateField = <
    K extends keyof Student
  >(
    key: K,
    value: Student[K]
  ) => {

    setForm((previous) => ({
      ...(previous ?? student),
      [key]: value,
    }));

  };


  /* ===================================================
     START EDIT
     =================================================== */

  const startEdit = () => {

    setForm({
      ...student,
    });

    setEditing(true);
  };


  /* ===================================================
     CANCEL EDIT
     =================================================== */

  const cancelEdit = () => {

    setForm(null);

    setEditing(false);
  };


  /* ===================================================
     SAVE PROFILE
     =================================================== */

  const saveProfile = () => {

    if (!form) {
      return;
    }

    setData((currentData) => ({
      ...currentData,

      students:
        currentData.students.map(
          (item) =>
            item.id === student.id
              ? form
              : item
        ),
    }));

    setForm(null);
    setEditing(false);
  };


  /* ===================================================
     RENDER
     =================================================== */

  return (

    <div className="pb-8">

      {/* ================================================= */}
      {/* BACK */}
      {/* ================================================= */}

      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-sky-600 transition hover:text-sky-700"
      >
        <ArrowLeft size={16} />
        Back to Students
      </button>


      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

        <div>

          <h1
            className="text-2xl font-bold text-slate-800"
            dir="rtl"
            lang="ar"
          >
            {displayName}
          </h1>

          <p className="mt-1 text-sm text-slate-500">

            {student.massarCode || 'No Massar Code'}
            {' · '}
            {cls?.name ?? '—'}
            {' · '}
            {student.gender}

          </p>

        </div>


        <div className="flex items-center gap-2">

          <StatusBadge
            status={
              summary.status
            }
          />

          <ProgressBadge
            progress={
              progress
            }
          />

          {!editing ? (

            <button
              type="button"
              onClick={startEdit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
            >
              <Pencil size={15} />
              Edit Profile
            </button>

          ) : (

            <>

              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <X size={15} />
                Cancel
              </button>

              <button
                type="button"
                onClick={saveProfile}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                <Save size={15} />
                Save Profile
              </button>

            </>

          )}

        </div>

      </div>


      {/* ================================================= */}
      {/* BASIC INFORMATION */}
      {/* ================================================= */}

      <Section title="Basic Information">

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <Info
            label="Massar Code"
            value={
              student.massarCode || '—'
            }
          />

          <Info
            label="Student ID"
            value={
              student.id
            }
          />

          <Info
            label="Date of Birth"
            value={
              formatDate(
                student.dateOfBirth
              )
            }
          />

          <Info
            label="Class"
            value={
              cls?.name ?? '—'
            }
          />

        </div>

      </Section>


      {/* ================================================= */}
      {/* QUICK ACADEMIC PROFILE */}
      {/* ================================================= */}

      <Section
        title="Educational Profile"
        className="mt-6"
      >

        {editing ? (

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <SelectField
              label="Learning Style"
              value={
                current.learningStyle ??
                'Not identified'
              }
              onChange={(value) =>
                updateField(
                  'learningStyle',
                  value as LearningStyle
                )
              }
              options={[
                'Visual',
                'Auditory',
                'Reading/Writing',
                'Kinesthetic',
                'Mixed',
                'Not identified',
              ]}
            />


            <SelectField
              label="Preferred Work"
              value={
                current.learningPreference ??
                'Mixed'
              }
              onChange={(value) =>
                updateField(
                  'learningPreference',
                  value as LearningPreference
                )
              }
              options={[
                'Individual work',
                'Pair work',
                'Group work',
                'Mixed',
              ]}
            />


            <SelectField
              label="Participation"
              value={
                current.participationLevel ??
                'Sometimes participates'
              }
              onChange={(value) =>
                updateField(
                  'participationLevel',
                  value as ParticipationLevel
                )
              }
              options={[
                'Very active',
                'Active',
                'Sometimes participates',
                'Rarely participates',
                'Passive',
              ]}
            />


            <SelectField
              label="Learning Behaviour"
              value={
                current.learningBehaviour ??
                'Mixed'
              }
              onChange={(value) =>
                updateField(
                  'learningBehaviour',
                  value as LearningBehaviour
                )
              }
              options={[
                'Independent',
                'Needs guidance',
                'Easily distracted',
                'Consistent',
                'Mixed',
              ]}
            />


            <SelectField
              label="Motivation"
              value={
                current.motivationLevel ??
                'Unknown'
              }
              onChange={(value) =>
                updateField(
                  'motivationLevel',
                  value as MotivationLevel
                )
              }
              options={[
                'Highly motivated',
                'Motivated',
                'Inconsistent',
                'Low motivation',
                'Unknown',
              ]}
            />


            <SelectField
              label="Learning Needs"
              value={
                current.learningNeeds ??
                'None identified'
              }
              onChange={(value) =>
                updateField(
                  'learningNeeds',
                  value
                )
              }
              options={[
                'None identified',
                'Reading support',
                'Writing support',
                'Speaking support',
                'Listening support',
                'Vocabulary support',
                'Grammar support',
                'General support',
              ]}
            />

          </div>

        ) : (

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <ProfileValue
              label="Learning Style"
              value={
                student.learningStyle
              }
            />

            <ProfileValue
              label="Preferred Work"
              value={
                student.learningPreference
              }
            />

            <ProfileValue
              label="Participation"
              value={
                student.participationLevel
              }
            />

            <ProfileValue
              label="Learning Behaviour"
              value={
                student.learningBehaviour
              }
            />

            <ProfileValue
              label="Motivation"
              value={
                student.motivationLevel
              }
            />

            <ProfileValue
              label="Learning Needs"
              value={
                student.learningNeeds
              }
            />

          </div>

        )}

      </Section>


      {/* ================================================= */}
      {/* CLASSROOM BEHAVIOUR */}
      {/* ================================================= */}

      <Section
        title="Classroom Behaviour"
        className="mt-6"
      >

        {editing ? (

          <div className="grid gap-4 sm:grid-cols-2">

            <SelectField
              label="Behaviour"
              value={
                current.classroomBehaviour ??
                'Good'
              }
              onChange={(value) =>
                updateField(
                  'classroomBehaviour',
                  value as ClassroomBehaviour
                )
              }
              options={[
                'Excellent',
                'Good',
                'Generally good',
                'Needs monitoring',
                'Frequent difficulties',
              ]}
            />


            <SelectField
              label="Attention"
              value={
                current.attentionLevel ??
                'Usually focused'
              }
              onChange={(value) =>
                updateField(
                  'attentionLevel',
                  value as AttentionLevel
                )
              }
              options={[
                'Focused',
                'Usually focused',
                'Easily distracted',
                'Needs frequent reminders',
              ]}
            />

          </div>

        ) : (

          <div className="grid gap-4 sm:grid-cols-2">

            <ProfileValue
              label="Behaviour"
              value={
                student.classroomBehaviour
              }
            />

            <ProfileValue
              label="Attention"
              value={
                student.attentionLevel
              }
            />

          </div>

        )}

      </Section>


      {/* ================================================= */}
      {/* LANGUAGE SKILLS */}
      {/* ================================================= */}

      <Section
        title="Language Skills"
        className="mt-6"
      >

        {editing ? (

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <SkillSelect
              label="English Level"
              value={current.englishLevel}
              onChange={(value) =>
                updateField(
                  'englishLevel',
                  value
                )
              }
            />

            <SkillSelect
              label="Speaking"
              value={current.speakingLevel}
              onChange={(value) =>
                updateField(
                  'speakingLevel',
                  value
                )
              }
            />

            <SkillSelect
              label="Listening"
              value={current.listeningLevel}
              onChange={(value) =>
                updateField(
                  'listeningLevel',
                  value
                )
              }
            />

            <SkillSelect
              label="Reading"
              value={current.readingLevel}
              onChange={(value) =>
                updateField(
                  'readingLevel',
                  value
                )
              }
            />

            <SkillSelect
              label="Writing"
              value={current.writingLevel}
              onChange={(value) =>
                updateField(
                  'writingLevel',
                  value
                )
              }
            />

          </div>

        ) : (

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <ProfileValue
              label="English"
              value={student.englishLevel}
            />

            <ProfileValue
              label="Speaking"
              value={student.speakingLevel}
            />

            <ProfileValue
              label="Listening"
              value={student.listeningLevel}
            />

            <ProfileValue
              label="Reading"
              value={student.readingLevel}
            />

            <ProfileValue
              label="Writing"
              value={student.writingLevel}
            />

          </div>

        )}

      </Section>


      {/* ================================================= */}
      {/* STRENGTHS & INTERESTS */}
      {/* ================================================= */}

      <Section
        title="Strengths & Interests"
        className="mt-6"
      >

        {editing ? (

          <div className="grid gap-4 sm:grid-cols-2">

            <TextAreaField
              label="Strengths"
              value={
                current.strengths ?? ''
              }
              placeholder="e.g. Good speaking skills, creative..."
              onChange={(value) =>
                updateField(
                  'strengths',
                  value
                )
              }
            />

            <TextAreaField
              label="Areas for Improvement"
              value={
                current.areasForImprovement ??
                ''
              }
              placeholder="e.g. Writing, vocabulary..."
              onChange={(value) =>
                updateField(
                  'areasForImprovement',
                  value
                )
              }
            />

            <TextAreaField
              label="Interests"
              value={
                current.interests ?? ''
              }
              placeholder="e.g. Football, technology, music..."
              onChange={(value) =>
                updateField(
                  'interests',
                  value
                )
              }
            />

            <TextAreaField
              label="Favourite Topics"
              value={
                current.favouriteTopics ??
                ''
              }
              placeholder="e.g. Sports, travel, science..."
              onChange={(value) =>
                updateField(
                  'favouriteTopics',
                  value
                )
              }
            />

          </div>

        ) : (

          <div className="grid gap-4 sm:grid-cols-2">

            <ProfileText
              label="Strengths"
              value={
                student.strengths
              }
            />

            <ProfileText
              label="Areas for Improvement"
              value={
                student.areasForImprovement
              }
            />

            <ProfileText
              label="Interests"
              value={
                student.interests
              }
            />

            <ProfileText
              label="Favourite Topics"
              value={
                student.favouriteTopics
              }
            />

          </div>

        )}

      </Section>


      {/* ================================================= */}
      {/* SOCIAL & SUPPORT */}
      {/* ================================================= */}

      <Section
        title="Social & Support"
        className="mt-6"
      >

        {editing ? (

          <div className="grid gap-4 sm:grid-cols-2">

            <SelectField
              label="Family Follow-up"
              value={
                current.familyFollowUp ??
                'Unknown'
              }
              onChange={(value) =>
                updateField(
                  'familyFollowUp',
                  value as FamilyFollowUp
                )
              }
              options={[
                'Good',
                'Occasional',
                'Limited',
                'Unknown',
              ]}
            />


            <SelectField
              label="Social / Educational Support"
              value={
                current.socialSupport ??
                'None'
              }
              onChange={(value) =>
                updateField(
                  'socialSupport',
                  value as SupportRequired
                )
              }
              options={[
                'None',
                'Academic support',
                'Behavioural support',
                'Individual attention',
                'Parental follow-up',
                'Regular monitoring',
              ]}
            />


            <SelectField
              label="Support Required"
              value={
                current.supportRequired ??
                'None'
              }
              onChange={(value) =>
                updateField(
                  'supportRequired',
                  value as SupportRequired
                )
              }
              options={[
                'None',
                'Academic support',
                'Behavioural support',
                'Individual attention',
                'Parental follow-up',
                'Regular monitoring',
              ]}
            />

          </div>

        ) : (

          <div className="grid gap-4 sm:grid-cols-2">

            <ProfileValue
              label="Family Follow-up"
              value={
                student.familyFollowUp
              }
            />

            <ProfileValue
              label="Social / Educational Support"
              value={
                student.socialSupport
              }
            />

            <ProfileValue
              label="Support Required"
              value={
                student.supportRequired
              }
            />

          </div>

        )}

      </Section>


      {/* ================================================= */}
      {/* HEALTH */}
      {/* ================================================= */}

      <Section
        title="Health & Accessibility"
        className="mt-6"
      >

        {editing ? (

          <div className="grid gap-4 sm:grid-cols-2">

            <SelectField
              label="Health Consideration"
              value={
                current.healthConsideration ??
                'Not provided'
              }
              onChange={(value) =>
                updateField(
                  'healthConsideration',
                  value as HealthConsideration
                )
              }
              options={[
                'None',
                'Vision',
                'Hearing',
                'Mobility',
                'Medical consideration',
                'Other',
                'Not provided',
              ]}
            />


            <TextAreaField
              label="Health / Accessibility Notes"
              value={
                current.healthNotes ??
                ''
              }
              placeholder="Only relevant information..."
              onChange={(value) =>
                updateField(
                  'healthNotes',
                  value
                )
              }
            />

          </div>

        ) : (

          <div className="grid gap-4 sm:grid-cols-2">

            <ProfileValue
              label="Health Consideration"
              value={
                student.healthConsideration
              }
            />

            <ProfileText
              label="Health / Accessibility Notes"
              value={
                student.healthNotes
              }
            />

          </div>

        )}

      </Section>


      {/* ================================================= */}
      {/* TEACHER NOTES */}
      {/* ================================================= */}

      <Section
        title="Teacher Notes"
        className="mt-6"
      >

        {editing ? (

          <TextAreaField
            label="Private Teacher Notes"
            value={
              current.teacherNotes ??
              ''
            }
            placeholder="Short notes that may help you support this student..."
            onChange={(value) =>
              updateField(
                'teacherNotes',
                value
              )
            }
          />

        ) : (

          <ProfileText
            label="Notes"
            value={
              student.teacherNotes
            }
          />

        )}

      </Section>


      {/* ================================================= */}
      {/* ACADEMIC OVERVIEW */}
      {/* ================================================= */}

      <div className="mt-6">

        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          Academic Overview
        </h2>


        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

          <Stat
            label="Attendance Rate"
            value={
              att.totalSessions > 0
                ? fmtPct(
                    att.attendanceRate
                  )
                : '-'
            }
          />

          <Stat
            label="Average Score"
            value={
              fmtPct(avg)
            }
          />

          <Stat
            label="Total Sessions"
            value={
              String(
                att.totalSessions
              )
            }
          />

          <Stat
            label="Assessments"
            value={
              String(
                assessments.length
              )
            }
          />

        </div>

      </div>


      {/* ================================================= */}
      {/* ATTENDANCE */}
      {/* ================================================= */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">

        <Section title="Attendance Summary">

          <div className="grid grid-cols-3 gap-3 text-center">

            <Mini
              label="Present"
              value={att.present}
              className="text-emerald-600"
            />

            <Mini
              label="Late"
              value={att.late}
              className="text-amber-600"
            />

            <Mini
              label="Absent"
              value={att.absent}
              className="text-rose-600"
            />

          </div>

        </Section>


        {/* ================================================= */}
        {/* ASSESSMENT SUMMARY */}
        {/* ================================================= */}

        <Section title="Assessment Summary">

          <div className="grid grid-cols-3 gap-3 text-center">

            <Mini
              label="Average %"
              value={
                avg !== null
                  ? avg.toFixed(1)
                  : '-'
              }
            />

            <Mini
              label="Assessments"
              value={
                assessments.length
              }
            />

            <Mini
              label="Progress"
              value={
                progress ===
                'Not enough data'
                  ? '-'
                  : progress
              }
            />

          </div>

        </Section>

      </div>


      {/* ================================================= */}
      {/* ATTENDANCE HISTORY */}
      {/* ================================================= */}

      <Section
        title="Attendance History"
        className="mt-6"
      >

        <HistoryTable>

          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">

            <tr>

              <th className="px-4 py-2">
                Date
              </th>

              <th className="px-4 py-2">
                Status
              </th>

            </tr>

          </thead>

          <tbody className="divide-y divide-slate-100">

            {data.attendance

              .filter(
                (a) =>
                  a.studentId ===
                  student.id
              )

              .sort(
                (a, b) =>
                  b.date.localeCompare(
                    a.date
                  )
              )

              .map((a) => (

                <tr key={a.id}>

                  <td className="px-4 py-2">
                    {a.date}
                  </td>

                  <td className="px-4 py-2">
                    {a.status}
                  </td>

                </tr>

              ))}

            {att.totalSessions === 0 &&
              emptyRow(2)}

          </tbody>

        </HistoryTable>

      </Section>


      {/* ================================================= */}
      {/* ASSESSMENT HISTORY */}
      {/* ================================================= */}

      <Section
        title="Assessment History"
        className="mt-6"
      >

        <HistoryTable>

          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">

            <tr>

              <th className="px-4 py-2">
                Date
              </th>

              <th className="px-4 py-2">
                Name
              </th>

              <th className="px-4 py-2">
                Type
              </th>

              <th className="px-4 py-2">
                Score
              </th>

              <th className="px-4 py-2">
                %
              </th>

            </tr>

          </thead>

          <tbody className="divide-y divide-slate-100">

            {assessments.map(
              (a) => (

                <tr key={a.id}>

                  <td className="px-4 py-2">
                    {a.date}
                  </td>

                  <td className="px-4 py-2">
                    {a.name}
                  </td>

                  <td className="px-4 py-2">
                    {a.type}
                  </td>

                  <td className="px-4 py-2">
                    {a.score}/{a.maxScore}
                  </td>

                  <td className="px-4 py-2">
                    {(
                      (a.score /
                        a.maxScore) *
                      100
                    ).toFixed(1)}
                    %
                  </td>

                </tr>

              )
            )}

            {assessments.length === 0 &&
              emptyRow(5)}

          </tbody>

        </HistoryTable>

      </Section>

    </div>
  );
}


/* =====================================================
   SECTION
   ===================================================== */

function Section({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {

  return (

    <section
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >

      <h2 className="mb-4 text-sm font-semibold text-slate-700">
        {title}
      </h2>

      {children}

    </section>
  );
}


/* =====================================================
   INFO
   ===================================================== */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="rounded-lg bg-slate-50 p-3">

      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-700">
        {value}
      </p>

    </div>
  );
}


/* =====================================================
   PROFILE VALUE
   ===================================================== */

function ProfileValue({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {

  return (

    <div>

      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-700">
        {value || 'Not provided'}
      </p>

    </div>
  );
}


/* =====================================================
   PROFILE TEXT
   ===================================================== */

function ProfileText({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {

  return (

    <div>

      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
        {value || 'Not provided'}
      </p>

    </div>
  );
}


/* =====================================================
   SELECT FIELD
   ===================================================== */

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {

  return (

    <div>

      <label className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="form-select"
      >

        {options.map(
          (option) => (

            <option
              key={option}
              value={option}
            >
              {option}
            </option>

          )
        )}

      </select>

    </div>
  );
}


/* =====================================================
   TEXT AREA
   ===================================================== */

function TextAreaField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {

  return (

    <div>

      <label className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        rows={3}
        className="form-input min-h-[90px] resize-y"
      />

    </div>
  );
}


/* =====================================================
   SKILL SELECT
   ===================================================== */

function SkillSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: SkillLevel;
  onChange: (
    value: SkillLevel
  ) => void;
}) {

  return (

    <SelectField
      label={label}
      value={
        value ?? 'Not assessed'
      }
      onChange={(selected) =>
        onChange(
          selected as SkillLevel
        )
      }
      options={[
        'Strong',
        'Good',
        'Developing',
        'Needs support',
        'Not assessed',
      ]}
    />
  );
}


/* =====================================================
   STAT
   ===================================================== */

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-slate-800">
        {value}
      </p>

    </div>
  );
}


/* =====================================================
   MINI
   ===================================================== */

function Mini({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string | number;
  className?: string;
}) {

  return (

    <div className="rounded-lg bg-slate-50 p-3">

      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p
        className={`mt-0.5 text-sm font-semibold text-slate-700 ${className}`}
      >
        {value}
      </p>

    </div>
  );
}


/* =====================================================
   HISTORY TABLE
   ===================================================== */

function HistoryTable({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <div className="overflow-x-auto rounded-lg border border-slate-100">

      <table className="w-full text-sm">

        {children}

      </table>

    </div>
  );
}


/* =====================================================
   EMPTY ROW
   ===================================================== */

function emptyRow(
  colspan: number
) {

  return (

    <tr>

      <td
        colSpan={colspan}
        className="px-4 py-4 text-center text-slate-400"
      >
        No records yet.
      </td>

    </tr>
  );
}


/* =====================================================
   DATE
   ===================================================== */

function formatDate(
  value?: string
) {

  if (!value) {
    return '—';
  }

  const parts =
    value.split('-');

  if (parts.length !== 3) {
    return value;
  }

  const [
    year,
    month,
    day,
  ] = parts;

  return `${day}-${month}-${year}`;
}