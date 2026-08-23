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

import { ArrowLeft } from 'lucide-react';


export function StudentProfile({
  studentId,
  onBack,
}: {
  studentId: string;
  onBack: () => void;
}) {

  const { data } = useData();

  /*
   * =====================================================
   * STUDENT
   * =====================================================
   */

  const student =
    data.students.find(
      (s) => s.id === studentId
    );


  /*
   * =====================================================
   * STUDENT NOT FOUND
   * =====================================================
   */

  if (!student) {

    return (

      <div>

        <button
          onClick={onBack}
          className="mb-4 text-sm text-sky-600 hover:underline"
        >
          ← Back
        </button>

        <p>
          Student not found.
        </p>

      </div>

    );

  }


  /*
   * =====================================================
   * CLASS
   * =====================================================
   */

  const cls =
    data.classes.find(
      (c) => c.id === student.classId
    );


  /*
   * =====================================================
   * ATTENDANCE
   * =====================================================
   */

  const att =
    getStudentAttendance(
      data.attendance,
      student.id
    );


  /*
   * =====================================================
   * ASSESSMENTS
   * =====================================================
   */

  const assessments =
    getStudentAssessments(
      data.assessments,
      student.id
    );


  /*
   * =====================================================
   * CALCULATIONS
   * =====================================================
   */

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


  /*
   * =====================================================
   * DISPLAY NAME
   *
   * Arabic name is the primary visible name.
   *
   * `student.name` remains as a fallback for
   * older records that may not have `nameAr`.
   * =====================================================
   */

  const displayName =
    student.nameAr?.trim() ||
    student.name ||
    '—';


  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (

    <div>

      {/* ================================================= */}
      {/* BACK BUTTON */}
      {/* ================================================= */}

      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-sky-600 transition hover:text-sky-700"
      >

        <ArrowLeft size={16} />

        Back to Students

      </button>


      {/* ================================================= */}
      {/* STUDENT HEADER */}
      {/* ================================================= */}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

        <div>

          <h1
            className="text-2xl font-bold text-slate-800"
            dir="rtl"
            lang="ar"
          >
            {displayName}
          </h1>


          <p className="text-sm text-slate-500">

            {student.id}
            {' · '}
            {cls?.name ?? '—'}
            {' · '}
            {student.gender}

          </p>

        </div>


        {/* STATUS */}

        <div className="flex gap-2">

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

        </div>

      </div>


      {/* ================================================= */}
      {/* STATISTICS */}
      {/* ================================================= */}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">

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


      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      <div className="grid gap-6 lg:grid-cols-2">


        {/* ================================================= */}
        {/* ATTENDANCE SUMMARY */}
        {/* ================================================= */}

        <Section
          title="Attendance Summary"
        >

          <div className="grid grid-cols-3 gap-3 text-center">

            <Mini
              label="Present"
              value={
                att.present
              }
              className="text-emerald-600"
            />


            <Mini
              label="Late"
              value={
                att.late
              }
              className="text-amber-600"
            />


            <Mini
              label="Absent"
              value={
                att.absent
              }
              className="text-rose-600"
            />

          </div>

        </Section>


        {/* ================================================= */}
        {/* ATTENDANCE HISTORY */}
        {/* ================================================= */}

        <Section
          title="Attendance History"
        >

          <HistoryTable>

            {assessmentsHeader([
              'Date',
              'Status',
            ])}


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

                    <td className="px-4 py-2 text-slate-700">

                      {a.date}

                    </td>


                    <td className="px-4 py-2 text-slate-600">

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
        {/* ASSESSMENT SUMMARY */}
        {/* ================================================= */}

        <Section
          title="Assessment Summary"
        >

          <div className="grid grid-cols-3 gap-3 text-center">

            <Mini
              label="Avg %"
              value={
                avg !== null
                  ? avg.toFixed(1)
                  : '-'
              }
            />


            <Mini
              label="Count"
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


        {/* ================================================= */}
        {/* ASSESSMENT HISTORY */}
        {/* ================================================= */}

        <Section
          title="Assessment History"
        >

          <HistoryTable>

            {assessmentsHeader([
              'Date',
              'Name',
              'Type',
              'Score',
              '%',
            ])}


            <tbody className="divide-y divide-slate-100">

              {assessments.map(
                (a) => (

                  <tr key={a.id}>

                    <td className="px-4 py-2 text-slate-700">

                      {a.date}

                    </td>


                    <td className="px-4 py-2 text-slate-700">

                      {a.name}

                    </td>


                    <td className="px-4 py-2 text-slate-600">

                      {a.type}

                    </td>


                    <td className="px-4 py-2 text-slate-600">

                      {a.score}
                      /
                      {a.maxScore}

                    </td>


                    <td className="px-4 py-2 text-slate-600">

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

    </div>

  );

}


/*
 * =====================================================
 * STAT
 * =====================================================
 */

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


/*
 * =====================================================
 * SECTION
 * =====================================================
 */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {

  return (

    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      <h3 className="mb-3 text-sm font-semibold text-slate-700">

        {title}

      </h3>


      {children}

    </div>

  );

}


/*
 * =====================================================
 * MINI
 * =====================================================
 */

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


/*
 * =====================================================
 * HISTORY TABLE
 * =====================================================
 */

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


/*
 * =====================================================
 * TABLE HEADER
 * =====================================================
 */

function assessmentsHeader(
  cols: string[]
) {

  return (

    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">

      <tr>

        {cols.map((c) => (

          <th
            key={c}
            className="px-4 py-2 font-semibold"
          >

            {c}

          </th>

        ))}

      </tr>

    </thead>

  );

}


/*
 * =====================================================
 * EMPTY ROW
 * =====================================================
 */

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