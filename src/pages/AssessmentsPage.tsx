import { useEffect, useMemo, useState } from 'react';
import { useData } from '@/store/DataContext';
import type {
  AssessmentRecord,
  OfficialAssessment,
  Term,
  IntegratedActivityRecord,
} from '@/types';
import { nextAssessmentId } from '@/lib/storage';
import { Save } from 'lucide-react';

/*
 * =====================================================
 * TYPES
 * =====================================================
 */

type ScoreDraft = Record<string, string>;

type IntegratedDraft = Record<
  string,
  {
    discipline: string;
    participation: string;
    copybook: string;
    projects: string;
  }
>;

type AssessmentSelection =
  | OfficialAssessment
  | 'Integrated Activities';

/*
 * The current project may still have an older
 * IntegratedActivityRecord type.
 *
 * These fields are required by the new assessment
 * system, so we extend the existing type locally.
 */

type IntegratedActivityWithTerm =
  IntegratedActivityRecord & {
    academicYear: string;
    term: Term;
  };

/*
 * =====================================================
 * CONSTANTS
 * =====================================================
 */

const TERMS: Term[] = [
  'First Term',
  'Second Term',
];

const ASSESSMENTS: {
  name: OfficialAssessment;
  maxScore: number;
}[] = [
  {
    name: 'Quiz 1',
    maxScore: 10,
  },
  {
    name: 'Quiz 2',
    maxScore: 10,
  },
  {
    name: 'Global Test',
    maxScore: 20,
  },
];

/*
 * =====================================================
 * PAGE
 * =====================================================
 */

export function AssessmentsPage() {
  const { data, setData } = useData();

  /*
   * ===================================================
   * STATE
   * ===================================================
   */

  const [classId, setClassId] = useState(
    data.classes[0]?.id ?? ''
  );

  const [term, setTerm] =
    useState<Term>('First Term');

  const [assessmentName, setAssessmentName] =
    useState<AssessmentSelection>('Quiz 1');

  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [draft, setDraft] =
    useState<ScoreDraft>({});

  const [integratedDraft, setIntegratedDraft] =
    useState<IntegratedDraft>({});

  const [saved, setSaved] = useState(false);

  /*
   * ===================================================
   * SAFE DATA
   * ===================================================
   */

  const classes = data.classes ?? [];
  const students = data.students ?? [];
  const assessments = data.assessments ?? [];

  /*
   * Cast locally so the page can work with the
   * extended Integrated Activity structure.
   */

  const integratedActivities =
    (data.integratedActivities ??
      []) as IntegratedActivityWithTerm[];

  /*
   * ===================================================
   * SELECTION
   * ===================================================
   */

  const isIntegrated =
    assessmentName === 'Integrated Activities';

  const selectedAssessment =
    ASSESSMENTS.find(
      (assessment) =>
        assessment.name === assessmentName
    );

  const maxScore =
    selectedAssessment?.maxScore ?? 20;

  const selectedClass =
    classes.find(
      (classRoom) => classRoom.id === classId
    );

  const academicYear =
    selectedClass?.academicYear ?? '';

  /*
   * ===================================================
   * STUDENTS
   * ===================================================
   */

  const classStudents = useMemo(() => {
    return students.filter(
      (student) =>
        student.classId === classId
    );
  }, [students, classId]);

  /*
   * ===================================================
   * LOAD NORMAL ASSESSMENTS
   * ===================================================
   */

  useEffect(() => {
    if (isIntegrated) {
      return;
    }

    const newDraft: ScoreDraft = {};

    for (const student of classStudents) {
      const existing =
        assessments.find(
          (assessment) =>
            assessment.studentId ===
              student.id &&
            assessment.classId ===
              classId &&
            assessment.academicYear ===
              academicYear &&
            assessment.term === term &&
            assessment.name ===
              assessmentName
        );

      newDraft[student.id] =
        existing !== undefined
          ? String(existing.score)
          : '';
    }

    setDraft(newDraft);
    setSaved(false);
  }, [
    classStudents,
    assessments,
    classId,
    academicYear,
    term,
    assessmentName,
    isIntegrated,
  ]);

  /*
   * ===================================================
   * LOAD INTEGRATED ACTIVITIES
   * ===================================================
   */

  useEffect(() => {
    if (!isIntegrated) {
      return;
    }

    const newDraft: IntegratedDraft = {};

    for (const student of classStudents) {
      const existing =
        integratedActivities.find(
          (activity) =>
            activity.studentId ===
              student.id &&
            activity.classId ===
              classId &&
            activity.academicYear ===
              academicYear &&
            activity.term === term &&
            activity.date === date
        );

      newDraft[student.id] = {
        discipline:
          existing !== undefined
            ? String(existing.discipline)
            : '',

        participation:
          existing !== undefined
            ? String(existing.participation)
            : '',

        copybook:
          existing !== undefined
            ? String(existing.copybook)
            : '',

        projects:
          existing !== undefined
            ? String(existing.projects)
            : '',
      };
    }

    setIntegratedDraft(newDraft);
    setSaved(false);
  }, [
    classStudents,
    integratedActivities,
    classId,
    academicYear,
    term,
    date,
    isIntegrated,
  ]);

  /*
   * ===================================================
   * NORMAL SCORE UPDATE
   * ===================================================
   */

  const setScore = (
    studentId: string,
    score: string
  ) => {
    setDraft((current) => ({
      ...current,
      [studentId]: score,
    }));

    setSaved(false);
  };

  /*
   * ===================================================
   * INTEGRATED SCORE UPDATE
   * ===================================================
   */

  const updateIntegratedScore = (
    studentId: string,
    field:
      | 'discipline'
      | 'participation'
      | 'copybook'
      | 'projects',
    value: string
  ) => {
    setIntegratedDraft((current) => ({
      ...current,

      [studentId]: {
        ...(current[studentId] ?? {
          discipline: '',
          participation: '',
          copybook: '',
          projects: '',
        }),

        [field]: value,
      },
    }));

    setSaved(false);
  };

  /*
   * ===================================================
   * GET INTEGRATED FIELD
   * ===================================================
   */

  const getIntegratedScore = (
    studentId: string,
    field:
      | 'discipline'
      | 'participation'
      | 'copybook'
      | 'projects'
  ) => {
    return (
      integratedDraft[studentId]?.[field] ??
      ''
    );
  };

  /*
   * ===================================================
   * GET INTEGRATED TOTAL
   * ===================================================
   */

  const getIntegratedTotal = (
    studentId: string
  ) => {
    const studentDraft =
      integratedDraft[studentId];

    if (!studentDraft) {
      return 0;
    }

    const discipline =
      parseFloat(
        studentDraft.discipline
      ) || 0;

    const participation =
      parseFloat(
        studentDraft.participation
      ) || 0;

    const copybook =
      parseFloat(
        studentDraft.copybook
      ) || 0;

    const projects =
      parseFloat(
        studentDraft.projects
      ) || 0;

    return (
      discipline +
      participation +
      copybook +
      projects
    );
  };

  /*
   * ===================================================
   * INTEGRATED SCORE VALIDATION
   * ===================================================
   */

  const isInvalidIntegratedScore = (
    value: string
  ) => {
    if (value.trim() === '') {
      return false;
    }

    const score = Number(value);

    return (
      !Number.isFinite(score) ||
      score < 0 ||
      score > 5
    );
  };

  /*
   * ===================================================
   * NORMAL SCORE VALIDATION
   * ===================================================
   */

  const isInvalidNormalScore = (
    value: string
  ) => {
    if (value.trim() === '') {
      return false;
    }

    const score = Number(value);

    return (
      !Number.isFinite(score) ||
      score < 0 ||
      score > maxScore
    );
  };

  /*
   * ===================================================
   * SAVE
   * ===================================================
   */

  const save = () => {
    /*
     * -------------------------------------------------
     * BASIC VALIDATION
     * -------------------------------------------------
     */

    if (!classId) {
      alert('Please select a class.');
      return;
    }

    if (!academicYear) {
      alert(
        'This class has no academic year.'
      );
      return;
    }

    if (classStudents.length === 0) {
      alert(
        'This class has no students.'
      );
      return;
    }

    /*
     * =================================================
     * INTEGRATED ACTIVITIES
     * =================================================
     */

    if (isIntegrated) {
      const errors: string[] = [];

      /*
       * VALIDATE ALL FIELDS
       */

      for (const student of classStudents) {
        const studentDraft =
          integratedDraft[student.id];

        if (!studentDraft) {
          continue;
        }

        const fields = [
          {
            label: 'Discipline',
            value:
              studentDraft.discipline,
          },
          {
            label: 'Participation',
            value:
              studentDraft.participation,
          },
          {
            label: 'Copybook',
            value:
              studentDraft.copybook,
          },
          {
            label: 'Projects',
            value:
              studentDraft.projects,
          },
        ];

        for (const field of fields) {
          if (
            field.value.trim() === ''
          ) {
            continue;
          }

          const score =
            Number(field.value);

          if (
            !Number.isFinite(score) ||
            score < 0 ||
            score > 5
          ) {
            errors.push(
              `${student.name}: ${field.label} must be between 0 and 5`
            );
          }
        }
      }

      if (errors.length > 0) {
        alert(
          'Please fix these errors:\n\n' +
            errors.join('\n')
        );

        return;
      }

      /*
       * CREATE RECORDS
       */

      const records: IntegratedActivityWithTerm[] =
        [];

      for (const student of classStudents) {
        const studentDraft =
          integratedDraft[student.id];

        if (!studentDraft) {
          continue;
        }

        const hasAnyScore =
          studentDraft.discipline.trim() !==
            '' ||
          studentDraft.participation.trim() !==
            '' ||
          studentDraft.copybook.trim() !==
            '' ||
          studentDraft.projects.trim() !==
            '';

        if (!hasAnyScore) {
          continue;
        }

        const discipline =
          Number(
            studentDraft.discipline
          ) || 0;

        const participation =
          Number(
            studentDraft.participation
          ) || 0;

        const copybook =
          Number(
            studentDraft.copybook
          ) || 0;

        const projects =
          Number(
            studentDraft.projects
          ) || 0;

        const total =
          discipline +
          participation +
          copybook +
          projects;

        const existing =
          integratedActivities.find(
            (activity) =>
              activity.studentId ===
                student.id &&
              activity.classId ===
                classId &&
              activity.academicYear ===
                academicYear &&
              activity.term === term &&
              activity.date === date
          );

        const newId =
          existing?.id ??
          `IA${String(
            integratedActivities.length +
              records.length +
              1
          ).padStart(4, '0')}`;

        records.push({
          id: newId,

          studentId:
            student.id,

          classId,

          academicYear,

          term,

          date,

          discipline,

          participation,

          copybook,

          projects,

          total,
        });
      }

      if (records.length === 0) {
        alert(
          'No scores entered to save.'
        );

        return;
      }

      /*
       * SAVE INTEGRATED ACTIVITIES
       */

      setData((previous) => {
        const current =
          (previous.integratedActivities ??
            []) as IntegratedActivityWithTerm[];

        const kept =
          current.filter(
            (activity) =>
              !(
                activity.classId ===
                  classId &&
                activity.academicYear ===
                  academicYear &&
                activity.term === term &&
                activity.date === date
              )
          );

        return {
          ...previous,

          integratedActivities: [
            ...kept,
            ...records,
          ],
        };
      });

      setSaved(true);

      return;
    }

    /*
     * =================================================
     * NORMAL ASSESSMENTS
     * =================================================
     */

    const errors: string[] = [];

    const records: AssessmentRecord[] =
      [];

    for (const student of classStudents) {
      const rawScore =
        draft[student.id];

      /*
       * Empty score is allowed.
       */

      if (
        rawScore === undefined ||
        rawScore.trim() === ''
      ) {
        continue;
      }

      const score =
        Number(rawScore);

      /*
       * INVALID NUMBER
       */

      if (!Number.isFinite(score)) {
        errors.push(
          `${student.name}: invalid score`
        );

        continue;
      }

      /*
       * OUT OF RANGE
       */

      if (
        score < 0 ||
        score > maxScore
      ) {
        errors.push(
          `${student.name}: score must be between 0 and ${maxScore}`
        );

        continue;
      }

      /*
       * EXISTING RECORD
       */

      const existing =
        assessments.find(
          (assessment) =>
            assessment.studentId ===
              student.id &&
            assessment.classId ===
              classId &&
            assessment.academicYear ===
              academicYear &&
            assessment.term === term &&
            assessment.name ===
              assessmentName
        );

      /*
       * CREATE RECORD
       */

      records.push({
        id:
          existing?.id ??
          nextAssessmentId(
            assessments
          ),

        studentId:
          student.id,

        classId,

        academicYear,

        term,

        date,

        name:
          assessmentName as OfficialAssessment,

        type:
          assessmentName ===
          'Global Test'
            ? 'Test'
            : 'Quiz',

        score,

        maxScore,
      });
    }

    /*
     * SHOW ERRORS
     */

    if (errors.length > 0) {
      alert(
        'Please fix these errors:\n\n' +
          errors.join('\n')
      );

      return;
    }

    /*
     * NOTHING TO SAVE
     */

    if (records.length === 0) {
      alert(
        'No scores entered to save.'
      );

      return;
    }

    /*
     * SAVE NORMAL ASSESSMENTS
     */

    setData((previous) => {
      const current =
        previous.assessments ?? [];

      const kept =
        current.filter(
          (assessment) =>
            !(
              assessment.classId ===
                classId &&
              assessment.academicYear ===
                academicYear &&
              assessment.term === term &&
              assessment.name ===
                assessmentName
            )
        );

      return {
        ...previous,

        assessments: [
          ...kept,
          ...records,
        ],
      };
    });

    setSaved(true);
  };

  /*
   * ===================================================
   * CLASS NAME
   * ===================================================
   */

  const className =
    selectedClass?.name ?? '—';

  /*
   * ===================================================
   * RENDER
   * ===================================================
   */

  return (
    <div className="space-y-5">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Assessments
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage quizzes, global tests and
          integrated activities by term.
        </p>
      </div>

      {/* ================================================= */}
      {/* CONTROLS */}
      {/* ================================================= */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

          {/* CLASS */}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Class
            </span>

            <select
              value={classId}
              onChange={(event) => {
                setClassId(
                  event.target.value
                );
                setSaved(false);
              }}
              className="form-select"
            >
              <option value="">
                Select...
              </option>

              {classes.map(
                (classRoom) => (
                  <option
                    key={classRoom.id}
                    value={classRoom.id}
                  >
                    {classRoom.name}
                  </option>
                )
              )}
            </select>
          </label>

          {/* ACADEMIC YEAR */}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Academic Year
            </span>

            <input
              value={academicYear}
              readOnly
              placeholder="Select a class"
              className="form-input bg-slate-50"
            />
          </label>

          {/* TERM */}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Term
            </span>

            <select
              value={term}
              onChange={(event) => {
                setTerm(
                  event.target.value as Term
                );
                setSaved(false);
              }}
              className="form-select"
            >
              {TERMS.map(
                (currentTerm) => (
                  <option
                    key={currentTerm}
                    value={currentTerm}
                  >
                    {currentTerm}
                  </option>
                )
              )}
            </select>
          </label>

          {/* ASSESSMENT */}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Assessment
            </span>

            <select
              value={assessmentName}
              onChange={(event) => {
                setAssessmentName(
                  event.target
                    .value as AssessmentSelection
                );

                setSaved(false);
              }}
              className="form-select"
            >
              {ASSESSMENTS.map(
                (assessment) => (
                  <option
                    key={assessment.name}
                    value={assessment.name}
                  >
                    {assessment.name}
                  </option>
                )
              )}

              <option value="Integrated Activities">
                Integrated Activities
              </option>
            </select>
          </label>

          {/* DATE */}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Date
            </span>

            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(
                  event.target.value
                );
                setSaved(false);
              }}
              className="form-input"
            />
          </label>

        </div>

        {/* SELECTED ASSESSMENT */}

        <div className="mt-4 flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">

          <div>
            <p className="text-xs font-medium text-slate-500">
              Selected assessment
            </p>

            <p className="font-semibold text-slate-800">
              {term} · {assessmentName}
            </p>
          </div>

          <div className="ml-auto">
            <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">
              /{maxScore}
            </span>
          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* STUDENTS */}
      {/* ================================================= */}

      {classId &&
        classStudents.length > 0 && (
          <>

            {/* SAVE BAR */}

            <div className="flex items-center gap-3">

              <button
                onClick={save}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
              >
                <Save size={16} />

                {isIntegrated
                  ? 'Save Activities'
                  : 'Save Assessment'}
              </button>

              {saved && (
                <span className="text-sm font-medium text-emerald-600">
                  Saved!
                </span>
              )}

            </div>

            {/* ================================================= */}
            {/* INTEGRATED ACTIVITIES */}
            {/* ================================================= */}

            {isIntegrated ? (

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">

                <table className="w-full text-sm">

                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">

                    <tr>

                      <th className="px-4 py-3 font-semibold">
                        Student ID
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Name
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Discipline /5
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Participation /5
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Copybook /5
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Projects /5
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Total /20
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {classStudents.map(
                      (student) => {
                        const total =
                          getIntegratedTotal(
                            student.id
                          );

                        return (
                          <tr
                            key={student.id}
                            className="hover:bg-slate-50/60"
                          >

                            {/* ID */}

                            <td className="px-4 py-3 font-medium text-slate-700">
                              {student.id}
                            </td>

                            {/* NAME */}

                            <td className="px-4 py-3 text-slate-700">
                              {student.name}
                            </td>

                            {/* FIELDS */}

                            {(
                              [
                                'discipline',
                                'participation',
                                'copybook',
                                'projects',
                              ] as const
                            ).map(
                              (field) => {
                                const value =
                                  getIntegratedScore(
                                    student.id,
                                    field
                                  );

                                const invalid =
                                  isInvalidIntegratedScore(
                                    value
                                  );

                                return (
                                  <td
                                    key={field}
                                    className="px-4 py-3"
                                  >
                                    <input
                                      type="number"
                                      min="0"
                                      max="5"
                                      step="0.5"
                                      value={value}
                                      onChange={(event) =>
                                        updateIntegratedScore(
                                          student.id,
                                          field,
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                      className={`w-20 rounded-lg border px-2 py-1.5 text-sm outline-none transition focus:ring-2 ${
                                        invalid
                                          ? 'border-rose-500 bg-rose-50 text-rose-700 focus:border-rose-500 focus:ring-rose-500/20'
                                          : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500/20'
                                      }`}
                                    />

                                    {invalid && (
                                      <p className="mt-1 text-xs font-medium text-rose-600">
                                        Max: 5
                                      </p>
                                    )}
                                  </td>
                                );
                              }
                            )}

                            {/* TOTAL */}

                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex min-w-[65px] justify-center rounded-lg px-2.5 py-1.5 font-semibold ${
                                  total > 20
                                    ? 'bg-rose-100 text-rose-700'
                                    : total === 20
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {total.toFixed(1)}
                                /20
                              </span>
                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            ) : (

              /* ================================================= */
              /* NORMAL ASSESSMENT */
              /* ================================================= */

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">

                <table className="w-full text-sm">

                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">

                    <tr>

                      <th className="px-4 py-3 font-semibold">
                        Student ID
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Name
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Score /{maxScore}
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Percentage
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {classStudents.map(
                      (student) => {
                        const rawScore =
                          draft[
                            student.id
                          ] ?? '';

                        const score =
                          Number(rawScore);

                        const hasScore =
                          rawScore.trim() !== '';

                        const validNumber =
                          Number.isFinite(score);

                        const percentage =
                          hasScore &&
                          validNumber
                            ? (score /
                                maxScore) *
                              100
                            : null;

                        const invalid =
                          hasScore &&
                          (
                            !validNumber ||
                            score < 0 ||
                            score > maxScore
                          );

                        return (
                          <tr
                            key={student.id}
                            className="hover:bg-slate-50/60"
                          >

                            {/* ID */}

                            <td className="px-4 py-3 font-medium text-slate-700">
                              {student.id}
                            </td>

                            {/* NAME */}

                            <td className="px-4 py-3 text-slate-700">
                              {student.name}
                            </td>

                            {/* SCORE */}

                            <td className="px-4 py-3">

                              <input
                                type="number"
                                min="0"
                                max={maxScore}
                                step="0.5"
                                value={rawScore}
                                onChange={(event) =>
                                  setScore(
                                    student.id,
                                    event.target
                                      .value
                                  )
                                }
                                className={`w-24 rounded-lg border px-2 py-1.5 text-sm outline-none transition focus:ring-2 ${
                                  invalid
                                    ? 'border-rose-400 bg-rose-50 text-rose-700 focus:border-rose-500 focus:ring-rose-500/20'
                                    : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500/20'
                                }`}
                              />

                              {invalid && (
                                <p className="mt-1 text-xs font-medium text-rose-600">
                                  Score must be between 0 and{' '}
                                  {maxScore}
                                </p>
                              )}

                            </td>

                            {/* PERCENTAGE */}

                            <td className="px-4 py-3 text-slate-600">

                              {percentage !==
                              null
                                ? `${percentage.toFixed(
                                    1
                                  )}%`
                                : '-'}

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </>
        )}

      {/* ================================================= */}
      {/* NO STUDENTS */}
      {/* ================================================= */}

      {classId &&
        classStudents.length === 0 && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            The class {className} has no
            students yet.
          </p>
        )}

      {/* ================================================= */}
      {/* NO CLASS */}
      {/* ================================================= */}

      {!classId && (
        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Select a class to enter assessment
          grades.
        </p>
      )}

    </div>
  );
}