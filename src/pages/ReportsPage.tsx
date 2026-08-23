import { useMemo, useState } from 'react';
import { useData } from '@/store/DataContext';
import { Eye, FileSpreadsheet } from 'lucide-react';
import { exportExcelReport } from '@/lib/excelReport';

type Term = 'First Term' | 'Second Term';

export function ReportsPage() {
  const { data } = useData();

  /*
   * =====================================================
   * REPORT INFORMATION
   * =====================================================
   */

  const [schoolName, setSchoolName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [academy, setAcademy] = useState('');
  const [province, setProvince] = useState('');
  const [subject, setSubject] = useState('');

  const [classId, setClassId] = useState('');
  const [term, setTerm] = useState<Term | ''>('');

  /*
   * =====================================================
   * SAFE DATA
   * =====================================================
   */

  const classes = data.classes ?? [];
  const students = data.students ?? [];
  const assessments = data.assessments ?? [];
  const integratedActivities =
    data.integratedActivities ?? [];

  /*
   * =====================================================
   * SELECTED CLASS
   * =====================================================
   */

  const selectedClass = classes.find(
    (classRoom) => classRoom.id === classId
  );

  /*
   * =====================================================
   * AUTOMATIC LEVEL
   *
   * Example:
   *
   * Class: 1APIC-1
   * Level:  1APIC
   *
   * Class: 2APIC-3
   * Level:  2APIC
   * =====================================================
   */

  const level = selectedClass?.grade ?? '';

  /*
   * =====================================================
   * AUTOMATIC ACADEMIC YEAR
   * =====================================================
   */

  const academicYear =
    selectedClass?.academicYear ?? '';

  /*
   * =====================================================
   * STUDENTS OF SELECTED CLASS
   * =====================================================
   */

  const classStudents = useMemo(() => {
    if (!classId) {
      return [];
    }

    return students.filter(
      (student) =>
        student.classId === classId
    );
  }, [
    students,
    classId,
  ]);

  /*
   * =====================================================
   * REPORT ROWS
   * =====================================================
   */

  const reportRows = useMemo(() => {
    if (!classId || !term) {
      return [];
    }

    return classStudents.map((student) => {
      /*
       * =================================================
       * STUDENT INFORMATION
       * =================================================
       */

      const studentExtra =
        student as typeof student & {
          nameAr?: string;
          arabicName?: string;
          dateOfBirth?: string;
        };

      const arabicName =
        studentExtra.nameAr?.trim() ||
        studentExtra.arabicName?.trim() ||
        student.name ||
        '—';

      /*
       * =================================================
       * ASSESSMENTS
       * =================================================
       */

      const studentAssessments =
        assessments.filter(
          (assessment) =>
            assessment.studentId ===
              student.id &&
            assessment.classId ===
              classId &&
            assessment.term === term &&
            (
              !academicYear ||
              assessment.academicYear ===
                academicYear
            )
        );

      /*
       * =================================================
       * QUIZ 1
       * =================================================
       */

      const quiz1 = Number(
        studentAssessments.find(
          (assessment) =>
            assessment.name === 'Quiz 1'
        )?.score ?? 0
      );

      /*
       * =================================================
       * QUIZ 2
       * =================================================
       */

      const quiz2 = Number(
        studentAssessments.find(
          (assessment) =>
            assessment.name === 'Quiz 2'
        )?.score ?? 0
      );

      /*
       * =================================================
       * FIRST TEST
       *
       * Quiz 1 + Quiz 2
       *
       * Example:
       *
       * Quiz 1 = 7
       * Quiz 2 = 8
       *
       * First Test = 15 / 20
       * =================================================
       */

      const firstTest =
        quiz1 + quiz2;

      /*
       * =================================================
       * GLOBAL TEST
       * =================================================
       */

      const globalTest = Number(
        studentAssessments.find(
          (assessment) =>
            assessment.name ===
            'Global Test'
        )?.score ?? 0
      );

      /*
       * =================================================
       * INTEGRATED ACTIVITIES
       * =================================================
       */

      const integratedRecords =
        integratedActivities
          .filter(
            (activity) =>
              activity.studentId ===
                student.id &&
              activity.classId ===
                classId &&
              activity.term ===
                term &&
              (
                !academicYear ||
                activity.academicYear ===
                  academicYear
              )
          )
          .sort((a, b) =>
            String(b.date).localeCompare(
              String(a.date)
            )
          );

      const integrated = Number(
        integratedRecords[0]?.total ?? 0
      );

      /*
       * =================================================
       * TOTAL
       *
       * First Test /20
       * Global Test /20
       * Integrated /20
       *
       * TOTAL = /60
       * =================================================
       */

      const total =
        firstTest +
        globalTest +
        integrated;

      /*
       * =================================================
       * PERCENTAGE
       * =================================================
       */

      const percentage =
        total > 0
          ? (total / 60) * 100
          : 0;

      return {
        id: student.id,

        name: arabicName,

        dateOfBirth:
          studentExtra.dateOfBirth ?? '',

        quiz1,

        quiz2,

        quizzes: firstTest,

        globalTest,

        integrated,

        total,

        percentage,
      };
    });
  }, [
    classStudents,
    assessments,
    integratedActivities,
    classId,
    term,
    academicYear,
  ]);

  /*
   * =====================================================
   * PREVIEW
   * =====================================================
   */

  const handlePreview = () => {
    document
      .getElementById('massar-report')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
  };

  /*
   * =====================================================
   * EXCEL EXPORT
   * =====================================================
   */

  const handleExcelExport = async () => {
    if (!classId) {
      alert(
        'Please select a class first.'
      );

      return;
    }

    if (!term) {
      alert(
        'Please select a term first.'
      );

      return;
    }

    if (reportRows.length === 0) {
      alert(
        'There are no students to export.'
      );

      return;
    }

    try {
      await exportExcelReport({
        rows: reportRows.map((row) => ({
          id: row.id,

          name: row.name,

          dateOfBirth:
            row.dateOfBirth,

          quiz1:
            Number(row.quiz1),

          quiz2:
            Number(row.quiz2),

          integrated:
            Number(row.integrated),

          globalTest:
            Number(row.globalTest),
        })),

        schoolName,

        teacherName,

        academicYear,

        academy,

        province,

        level,

        subject,

        className:
          selectedClass?.name ?? '',

        term,
      });
    } catch (error) {
      console.error(
        'Excel export failed:',
        error
      );

      alert(
        'Could not generate the Excel report.'
      );
    }
  };

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold text-slate-800">
            Reports
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create and export teacher reports.
          </p>

        </div>

        <div className="flex gap-2">

          {/* PREVIEW */}

          <button
            onClick={handlePreview}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            <Eye size={17} />

            Generate Preview
          </button>

          {/* EXCEL */}

          <button
            onClick={handleExcelExport}
            disabled={
              !classId ||
              !term ||
              reportRows.length === 0
            }
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <FileSpreadsheet size={17} />

            Export Excel
          </button>

        </div>

      </div>

      {/* =================================================
          REPORT INFORMATION
          ================================================= */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <h2 className="mb-4 text-base font-semibold text-slate-800">
          Report Information
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

          {/* SCHOOL */}

          <Field
            label="School Name"
            value={schoolName}
            onChange={setSchoolName}
            placeholder="Enter school name"
          />

          {/* TEACHER */}

          <Field
            label="Teacher Name"
            value={teacherName}
            onChange={setTeacherName}
            placeholder="Enter teacher name"
          />

          {/* ACADEMY */}

          <Field
            label="Academy"
            value={academy}
            onChange={setAcademy}
            placeholder="Enter academy"
          />

          {/* PROVINCE */}

          <Field
            label="Provincial Directorate"
            value={province}
            onChange={setProvince}
            placeholder="Enter provincial directorate"
          />

          {/* SUBJECT */}

          <Field
            label="Subject"
            value={subject}
            onChange={setSubject}
            placeholder="Enter subject"
          />

          {/* LEVEL */}

          <label className="block">

            <span className="mb-1 block text-xs font-medium text-slate-600">
              Level
            </span>

            <input
              type="text"
              value={level}
              readOnly
              placeholder="Select a class first"
              className="form-input bg-slate-50"
            />

          </label>

          {/* ACADEMIC YEAR */}

          <label className="block">

            <span className="mb-1 block text-xs font-medium text-slate-600">
              Academic Year
            </span>

            <input
              type="text"
              value={academicYear}
              readOnly
              placeholder="Select a class first"
              className="form-input bg-slate-50"
            />

          </label>

          {/* CLASS */}

          <label className="block">

            <span className="mb-1 block text-xs font-medium text-slate-600">
              Class
            </span>

            <select
              value={classId}
              onChange={(e) =>
                setClassId(
                  e.target.value
                )
              }
              className="form-select"
            >

              <option value="">
                Select class...
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

          {/* TERM */}

          <label className="block">

            <span className="mb-1 block text-xs font-medium text-slate-600">
              Term
            </span>

            <select
              value={term}
              onChange={(e) => {

                const value =
                  e.target.value;

                if (
                  value ===
                    'First Term' ||
                  value ===
                    'Second Term'
                ) {
                  setTerm(value);
                } else {
                  setTerm('');
                }

              }}
              className="form-select"
            >

              <option value="">
                Select term...
              </option>

              <option value="First Term">
                First Term
              </option>

              <option value="Second Term">
                Second Term
              </option>

            </select>

          </label>

        </div>
      </div>

      {/* =================================================
          CURRENT SELECTION
          ================================================= */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <h2 className="mb-4 text-base font-semibold text-slate-800">
          Current Selection
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <Info
            label="School"
            value={
              schoolName ||
              'Not specified'
            }
          />

          <Info
            label="Teacher"
            value={
              teacherName ||
              'Not specified'
            }
          />

          <Info
            label="Academic Year"
            value={
              academicYear ||
              'Not specified'
            }
          />

          <Info
            label="Academy"
            value={
              academy ||
              'Not specified'
            }
          />

          <Info
            label="Provincial Directorate"
            value={
              province ||
              'Not specified'
            }
          />

          <Info
            label="Level"
            value={
              level ||
              'Not specified'
            }
          />

          <Info
            label="Subject"
            value={
              subject ||
              'Not specified'
            }
          />

          <Info
            label="Class"
            value={
              selectedClass?.name ||
              'Not selected'
            }
          />

          <Info
            label="Term"
            value={
              term ||
              'Not selected'
            }
          />

        </div>

      </div>

      {/* =================================================
          MASSAR PREVIEW
          ================================================= */}

      <div
        id="massar-report"
        className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm"
        dir="rtl"
        lang="ar"
      >

        <div className="min-w-[1150px] p-8 text-black">

          {/* TITLE */}

          <div className="mb-6 text-center">

            <h2 className="text-2xl font-bold underline">
              نقط المراقبة المستمرة
            </h2>

          </div>

          {/* ADMINISTRATIVE HEADER */}

          <div className="mb-6 grid grid-cols-3 gap-8 p-4 text-sm leading-7">

            {/* RIGHT */}

            <div className="text-right">

              <p>
                <strong>
                  أكاديمية :
                </strong>{' '}

                {academy || ' '}
              </p>

              <p>
                <strong>
                  المستوى :
                </strong>{' '}

                {level || ' '}
              </p>

              <p>
                <strong>
                  الدورة :
                </strong>{' '}

                {term === 'First Term'
                  ? 'الدورة الأولى'
                  : term ===
                    'Second Term'
                  ? 'الدورة الثانية'
                  : ' '}
              </p>

              <p>
                <strong>
                  السنة الدراسية :
                </strong>{' '}

                {academicYear || ' '}
              </p>

            </div>

            {/* CENTER */}

            <div className="text-center">

              <p>
                <strong>
                  م.الإقليمية:
                </strong>{' '}

                {province || ' '}
              </p>

              <p>
                <strong>
                  القسم :
                </strong>{' '}

                {selectedClass?.name ||
                  ' '}
              </p>

              <p>
                <strong>
                  نقط :
                </strong>
              </p>

            </div>

            {/* LEFT */}

            <div className="text-right">

              <p>
                <strong>
                  مؤسسة :
                </strong>{' '}

                {schoolName || ' '}
              </p>

              <p>
                <strong>
                  الأستاذ :
                </strong>{' '}

                {teacherName || ' '}
              </p>

              <p>
                <strong>
                  المادة :
                </strong>{' '}

                {subject || ' '}
              </p>

            </div>

          </div>

          {/* =================================================
              TABLE
              ================================================= */}

          <table
            className="w-full border-collapse border border-black text-sm"
            dir="rtl"
          >

            <thead>

              <tr className="bg-slate-100">

                <th
                  rowSpan={2}
                  className="border border-black px-3 py-3 text-center align-middle"
                >
                  رقم التلميذ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-3 py-3 text-center align-middle"
                >
                  إسم التلميذ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-3 py-3 text-center align-middle"
                >
                  تاريخ الإزدياد
                </th>

                <th
                  colSpan={1}
                  className="border border-black px-3 py-3 text-center"
                >
                  الفرض الأول
                </th>

                <th
                  colSpan={1}
                  className="border border-black px-3 py-3 text-center"
                >
                  الفرض الثاني
                </th>

                <th
                  colSpan={1}
                  className="border border-black px-3 py-3 text-center"
                >
                  الأنشطة المندمجة
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-3 py-3 text-center align-middle"
                >
                  ملاحظات الأستاذ
                </th>

              </tr>

              <tr className="bg-slate-100">

                <th className="border border-black px-3 py-2 text-center">
                  النقطة /20
                </th>

                <th className="border border-black px-3 py-2 text-center">
                  النقطة /20
                </th>

                <th className="border border-black px-3 py-2 text-center">
                  النقطة /20
                </th>

              </tr>

            </thead>

            <tbody>

              {reportRows.map(
                (row, index) => (

                  <tr
                    key={row.id}
                    className={
                      index % 2 === 0
                        ? 'bg-white'
                        : 'bg-slate-50'
                    }
                  >

                    <td
                      className="border border-black px-3 py-2 text-center"
                      dir="ltr"
                    >
                      {index + 1}
                    </td>

                    <td
                      className="border border-black px-3 py-2 text-right font-medium"
                      dir="rtl"
                      lang="ar"
                    >
                      {row.name}
                    </td>

                    <td
                      className="border border-black px-3 py-2 text-center"
                      dir="ltr"
                    >
                      {formatDate(
                        row.dateOfBirth
                      )}
                    </td>

                    {/* FIRST TEST */}

                    <td className="border border-black px-3 py-2 text-center">
                      {formatScore(
                        row.quizzes
                      )}
                    </td>

                    {/* GLOBAL TEST */}

                    <td className="border border-black px-3 py-2 text-center">
                      {formatScore(
                        row.globalTest
                      )}
                    </td>

                    {/* INTEGRATED */}

                    <td className="border border-black px-3 py-2 text-center">
                      {formatScore(
                        row.integrated
                      )}
                    </td>

                    {/* NOTES */}

                    <td className="border border-black px-3 py-2 text-center">
                      -
                    </td>

                  </tr>

                )
              )}

              {reportRows.length === 0 && (

                <tr>

                  <td
                    colSpan={7}
                    className="border border-black px-4 py-10 text-center text-sm"
                  >

                    {!classId
                      ? 'المرجو اختيار القسم'
                      : !term
                      ? 'المرجو اختيار الدورة'
                      : classStudents.length ===
                        0
                      ? 'لا يوجد تلاميذ في هذا القسم'
                      : 'لا توجد نقط مسجلة لهذه المعايير'}

                  </td>

                </tr>

              )}

            </tbody>

          </table>

          {/* =================================================
              FOOTER
              ================================================= */}

          {reportRows.length > 0 && (

            <div className="mt-6 flex justify-between text-sm">

              <div>
                عدد التلاميذ:

                <strong className="mr-2">
                  {reportRows.length}
                </strong>
              </div>

              <div>
                الأستاذ:

                <strong className="mr-2">
                  {teacherName || ' '}
                </strong>
              </div>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   FIELD
   ===================================================== */

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">

      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>

      <input
        type="text"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="form-input"
      />

    </label>
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

      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-700">
        {value}
      </p>

    </div>
  );
}

/* =====================================================
   SCORE FORMAT
   ===================================================== */

function formatScore(value: number) {
  return Number(
    value ?? 0
  ).toFixed(2);
}

/* =====================================================
   DATE FORMAT
   ===================================================== */

function formatDate(value: string) {
  if (!value) {
    return '—';
  }

  const parts = value.split('-');

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