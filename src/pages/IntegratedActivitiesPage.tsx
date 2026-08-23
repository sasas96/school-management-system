import { useEffect, useMemo, useState } from 'react';
import { useData } from '@/store/DataContext';
import type {
  IntegratedActivityRecord,
  Term,
} from '@/types';
import { Save } from 'lucide-react';

type ScoreField =
  | 'discipline'
  | 'participation'
  | 'copybook'
  | 'projects';

type StudentDraft = {
  discipline: string;
  participation: string;
  copybook: string;
  projects: string;
};

type Draft = Record<string, StudentDraft>;

interface IntegratedActivitiesPageProps {
  classId: string;
  term: Term;
  date: string;
}

const fields: {
  key: ScoreField;
  label: string;
}[] = [
  {
    key: 'discipline',
    label: 'Discipline',
  },
  {
    key: 'participation',
    label: 'Participation',
  },
  {
    key: 'copybook',
    label: 'Copybook',
  },
  {
    key: 'projects',
    label: 'Projects',
  },
];

export function IntegratedActivitiesPage({
  classId,
  term,
  date,
}: IntegratedActivitiesPageProps) {
  const { data, setData } = useData();

  const [draft, setDraft] = useState<Draft>({});
  const [saved, setSaved] = useState(false);

  const selectedClass = data.classes.find(
    (classRoom) => classRoom.id === classId
  );

  const academicYear =
    selectedClass?.academicYear ?? '';

  const classStudents = useMemo(() => {
    return data.students.filter(
      (student) =>
        student.classId === classId
    );
  }, [data.students, classId]);

  /*
   * =====================================================
   * LOAD EXISTING VALUES
   * =====================================================
   */

  useEffect(() => {
    const newDraft: Draft = {};

    for (const student of classStudents) {
      const existing =
        data.integratedActivities.find(
          (activity) =>
            activity.studentId === student.id &&
            activity.classId === classId &&
            activity.academicYear === academicYear &&
            activity.term === term &&
            activity.date === date
        );

      newDraft[student.id] = {
        discipline:
          existing
            ? String(existing.discipline)
            : '',

        participation:
          existing
            ? String(existing.participation)
            : '',

        copybook:
          existing
            ? String(existing.copybook)
            : '',

        projects:
          existing
            ? String(existing.projects)
            : '',
      };
    }

    setDraft(newDraft);
    setSaved(false);
  }, [
    classStudents,
    data.integratedActivities,
    classId,
    academicYear,
    term,
    date,
  ]);

  /*
   * =====================================================
   * GET VALUE
   * =====================================================
   */

  const getValue = (
    studentId: string,
    field: ScoreField
  ) => {
    return draft[studentId]?.[field] ?? '';
  };

  /*
   * =====================================================
   * IS INVALID
   * =====================================================
   */

  const isInvalid = (
    value: string
  ): boolean => {
    if (value.trim() === '') {
      return false;
    }

    const number = Number(value);

    return (
      !Number.isFinite(number) ||
      number < 0 ||
      number > 5
    );
  };

  /*
   * =====================================================
   * UPDATE VALUE
   * =====================================================
   */

  const updateValue = (
    studentId: string,
    field: ScoreField,
    value: string
  ) => {
    setDraft((current) => ({
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
   * =====================================================
   * TOTAL
   * =====================================================
   */

  const getTotal = (
    studentId: string
  ) => {
    const student = draft[studentId];

    if (!student) {
      return 0;
    }

    return (
      (Number(student.discipline) || 0) +
      (Number(student.participation) || 0) +
      (Number(student.copybook) || 0) +
      (Number(student.projects) || 0)
    );
  };

  /*
   * =====================================================
   * STUDENT HAS INVALID SCORE
   * =====================================================
   */

  const studentHasError = (
    studentId: string
  ) => {
    return fields.some((field) =>
      isInvalid(
        getValue(
          studentId,
          field.key
        )
      )
    );
  };

  /*
   * =====================================================
   * SAVE
   * =====================================================
   */

  const save = () => {
    if (!classId) {
      alert(
        'Please select a class.'
      );
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
     * Check invalid values
     */

    const errors: string[] = [];

    for (const student of classStudents) {
      for (const field of fields) {
        const value = getValue(
          student.id,
          field.key
        );

        if (isInvalid(value)) {
          errors.push(
            `${student.name}: ${field.label} must be between 0 and 5.`
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
     * Create records
     */

    const records: IntegratedActivityRecord[] =
      [];

    for (const student of classStudents) {
      const studentDraft =
        draft[student.id];

      if (!studentDraft) {
        continue;
      }

      const hasAnyScore =
        studentDraft.discipline !== '' ||
        studentDraft.participation !== '' ||
        studentDraft.copybook !== '' ||
        studentDraft.projects !== '';

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
        data.integratedActivities.find(
          (activity) =>
            activity.studentId === student.id &&
            activity.classId === classId &&
            activity.academicYear === academicYear &&
            activity.term === term &&
            activity.date === date
        );

      records.push({
        id:
          existing?.id ??
          `IA${String(
            data.integratedActivities.length +
              records.length +
              1
          ).padStart(4, '0')}`,

        studentId: student.id,
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
     * Save
     */

    setData((previous) => {
      const kept =
        previous.integratedActivities.filter(
          (activity) =>
            !(
              activity.classId === classId &&
              activity.academicYear === academicYear &&
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
  };

  const className =
    selectedClass?.name ?? '—';

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <div>

      {/* HEADER */}

      <div className="mb-5 flex items-center justify-between">

        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Integrated Activities
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Discipline, participation,
            copybook and projects.
          </p>
        </div>

        <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">
          /20
        </span>

      </div>

      {/* STUDENTS */}

      {classId &&
        classStudents.length > 0 && (
          <>

            {/* SAVE */}

            <div className="mb-3 flex items-center gap-3">

              <button
                type="button"
                onClick={save}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
              >
                <Save size={16} />

                Save Activities
              </button>

              {saved && (
                <span className="text-sm font-medium text-emerald-600">
                  Saved!
                </span>
              )}

            </div>

            {/* TABLE */}

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
                        getTotal(
                          student.id
                        );

                      const hasError =
                        studentHasError(
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

                          {/* SCORES */}

                          {fields.map(
                            (field) => {

                              const value =
                                getValue(
                                  student.id,
                                  field.key
                                );

                              const invalid =
                                isInvalid(
                                  value
                                );

                              return (
                                <td
                                  key={field.key}
                                  className="px-4 py-3"
                                >

                                  <div className="flex flex-col">

                                    <input
                                      type="number"
                                      value={value}
                                      min={0}
                                      max={5}
                                      step={0.5}
                                      onChange={(event) => {
                                        const newValue =
                                          event.target.value;

                                        updateValue(
                                          student.id,
                                          field.key,
                                          newValue
                                        );
                                      }}
                                      onInput={(event) => {
                                        const input =
                                          event.currentTarget;

                                        const newValue =
                                          input.value;

                                        updateValue(
                                          student.id,
                                          field.key,
                                          newValue
                                        );
                                      }}
                                      className={
                                        invalid
                                          ? 'w-20 rounded-lg border-2 border-red-500 bg-red-50 px-2 py-1.5 text-sm text-red-700 outline-none ring-2 ring-red-200'
                                          : 'w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                                      }
                                    />

                                    {invalid && (
                                      <span className="mt-1 whitespace-nowrap text-xs font-semibold text-red-600">
                                        Maximum: 5
                                      </span>
                                    )}

                                  </div>

                                </td>
                              );
                            }
                          )}

                          {/* TOTAL */}

                          <td className="px-4 py-3">

                            <span
                              className={
                                hasError
                                  ? 'inline-flex min-w-[60px] justify-center rounded-lg bg-red-100 px-2.5 py-1.5 font-semibold text-red-700'
                                  : total === 20
                                  ? 'inline-flex min-w-[60px] justify-center rounded-lg bg-emerald-100 px-2.5 py-1.5 font-semibold text-emerald-700'
                                  : 'inline-flex min-w-[60px] justify-center rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700'
                              }
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

          </>
        )}

      {/* NO STUDENTS */}

      {classId &&
        classStudents.length === 0 && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            The class {className} has
            no students yet.
          </p>
        )}

      {/* NO CLASS */}

      {!classId && (
        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Select a class to enter
          integrated activity grades.
        </p>
      )}

    </div>
  );
}