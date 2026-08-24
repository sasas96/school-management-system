import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useData } from '@/store/DataContext';

import type {
  AssessmentRecord,
  IntegratedActivityRecord,
  OfficialAssessment,
  Term,
} from '@/types';

import {
  Download,
  Save,
} from 'lucide-react';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const INTEGRATED_FIELDS = [
  'discipline',
  'participation',
  'copybook',
  'projects',
] as const;

type IntegratedField =
  (typeof INTEGRATED_FIELDS)[number];

const EMPTY_INTEGRATED_VALUES = {
  discipline: '',
  participation: '',
  copybook: '',
  projects: '',
};

/*
 * =====================================================
 * HELPERS
 * =====================================================
 */

const formatScore = (
  value: number
): string => {
  if (
    Number.isInteger(value)
  ) {
    return String(value);
  }

  return String(
    Number(value.toFixed(2))
  );
};

const formatScoreOutOf = (
  value: number,
  max: number
): string => {
  return `${formatScore(value)}/${max}`;
};

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
    data.classes?.[0]?.id ?? ''
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

  const [saved, setSaved] =
    useState(false);

  /*
   * ===================================================
   * DATA
   * ===================================================
   */

  const classes = data.classes ?? [];
  const students = data.students ?? [];
  const assessments = data.assessments ?? [];
  const integratedActivities =
    data.integratedActivities ?? [];

  const isIntegrated =
    assessmentName === 'Integrated Activities';

  const selectedAssessment =
    ASSESSMENTS.find(
      (item) =>
        item.name === assessmentName
    );

  const maxScore =
    selectedAssessment?.maxScore ?? 20;

  const selectedClass =
    classes.find(
      (item) => item.id === classId
    );

  const academicYear =
    selectedClass?.academicYear ?? '';

  const className =
    selectedClass?.name ?? '—';

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
   * MASSAR CODE
   * ===================================================
   */

  const updateMassarCode = (
    studentId: string,
    value: string
  ) => {
    setData((previous) => ({
      ...previous,

      students: previous.students.map(
        (student) =>
          student.id === studentId
            ? {
                ...student,
                massarCode: value,
              }
            : student
      ),
    }));
  };

  /*
   * ===================================================
   * LOAD NORMAL ASSESSMENT
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

      newDraft[student.id] =
        existing !== undefined
          ? {
              discipline:
                String(existing.discipline),

              participation:
                String(existing.participation),

              copybook:
                String(existing.copybook),

              projects:
                String(existing.projects),
            }
          : {
              ...EMPTY_INTEGRATED_VALUES,
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
   * NORMAL SCORE
   * ===================================================
   */

  const setScore = (
    studentId: string,
    value: string
  ) => {
    setDraft((current) => ({
      ...current,
      [studentId]: value,
    }));

    setSaved(false);
  };

  /*
   * ===================================================
   * INTEGRATED SCORE
   * ===================================================
   */

  const updateIntegratedScore = (
    studentId: string,
    field: IntegratedField,
    value: string
  ) => {
    setIntegratedDraft((current) => ({
      ...current,

      [studentId]: {
        ...(current[studentId] ?? {
          ...EMPTY_INTEGRATED_VALUES,
        }),

        [field]: value,
      },
    }));

    setSaved(false);
  };

  const getIntegratedScore = (
    studentId: string,
    field: IntegratedField
  ) => {
    return (
      integratedDraft[studentId]?.[field] ??
      ''
    );
  };

  const getIntegratedTotal = (
    studentId: string
  ) => {
    const values =
      integratedDraft[studentId];

    if (!values) {
      return 0;
    }

    return (
      (Number(values.discipline) || 0) +
      (Number(values.participation) || 0) +
      (Number(values.copybook) || 0) +
      (Number(values.projects) || 0)
    );
  };

  /*
   * ===================================================
   * VALIDATION
   * ===================================================
   */

  const invalidIntegrated = (
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
   * SAVE
   * ===================================================
   */

  const save = () => {
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

      for (const student of classStudents) {
        const values =
          integratedDraft[student.id];

        if (!values) {
          continue;
        }

        for (const field of INTEGRATED_FIELDS) {
          const value = values[field];

          if (value.trim() === '') {
            continue;
          }

          const score = Number(value);

          if (
            !Number.isFinite(score) ||
            score < 0 ||
            score > 5
          ) {
            errors.push(
              `${student.name}: ${field} must be between 0 and 5`
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

      const records:
        IntegratedActivityRecord[] = [];

      const idBase = Date.now();

      for (
        let index = 0;
        index < classStudents.length;
        index++
      ) {
        const student =
          classStudents[index];

        const values =
          integratedDraft[student.id];

        if (!values) {
          continue;
        }

        const hasAny =
          INTEGRATED_FIELDS.some(
            (field) =>
              values[field].trim() !== ''
          );

        if (!hasAny) {
          continue;
        }

        const discipline =
          Number(values.discipline) || 0;

        const participation =
          Number(values.participation) || 0;

        const copybook =
          Number(values.copybook) || 0;

        const projects =
          Number(values.projects) || 0;

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

        records.push({
          id:
            existing?.id ??
            `IA-${idBase}-${index}`,

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

      setData((previous) => {
        const current =
          previous.integratedActivities ??
          [];

        const kept = current.filter(
          (activity) =>
            !(
              activity.classId === classId &&
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
     * NORMAL ASSESSMENT
     * =================================================
     */

    const errors: string[] = [];
    const records: AssessmentRecord[] = [];

    const idBase = Date.now();

    for (
      let index = 0;
      index < classStudents.length;
      index++
    ) {
      const student =
        classStudents[index];

      const raw =
        draft[student.id];

      if (
        raw === undefined ||
        raw.trim() === ''
      ) {
        continue;
      }

      const score = Number(raw);

      if (
        !Number.isFinite(score) ||
        score < 0 ||
        score > maxScore
      ) {
        errors.push(
          `${student.name}: score must be between 0 and ${maxScore}`
        );
        continue;
      }

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

      records.push({
        id:
          existing?.id ??
          `A-${idBase}-${index}`,

        studentId: student.id,
        classId,
        academicYear,
        date,

        name:
          assessmentName as OfficialAssessment,

        type:
          assessmentName ===
          'Global Test'
            ? 'Test'
            : 'Quiz',

        term,
        score,
        maxScore,
      });
    }

    if (errors.length > 0) {
      alert(
        'Please fix these errors:\n\n' +
          errors.join('\n')
      );
      return;
    }

    if (records.length === 0) {
      alert(
        'No scores entered to save.'
      );
      return;
    }

    setData((previous) => {
      const current =
        previous.assessments ?? [];

      const kept = current.filter(
        (assessment) =>
          !(
            assessment.classId === classId &&
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
   * REPORT HELPERS
   * ===================================================
   */

  const getRemarks = (
    grade: number
  ) => {
    if (grade >= 17) {
      return 'Excellent';
    }

    if (grade >= 14) {
      return 'Good';
    }

    if (grade >= 10) {
      return 'Satisfactory';
    }

    if (grade >= 5) {
      return 'Weak';
    }

    return 'Poor';
  };

  const getAssessmentScore = (
    studentId: string,
    name: OfficialAssessment
  ) => {
    const record =
      assessments.find(
        (assessment) =>
          assessment.studentId ===
            studentId &&
          assessment.classId ===
            classId &&
          assessment.academicYear ===
            academicYear &&
          assessment.term === term &&
          assessment.name === name
      );

    return record?.score ?? null;
  };

  const getIntegratedRecord = (
    studentId: string
  ) => {
    return integratedActivities.find(
      (activity) =>
        activity.studentId ===
          studentId &&
        activity.classId ===
          classId &&
        activity.academicYear ===
          academicYear &&
        activity.term === term &&
        activity.date === date
    );
  };

  /*
   * ===================================================
   * PDF EXPORT
   * ===================================================
   */

  const exportPDF = async () => {
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

    try {
      /*
       * ===============================================
       * CREATE PDF
       * ===============================================
       */

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      /*
       * ===============================================
       * LOAD AMIRI FONT
       * ===============================================
       */

      try {
        const fontResponse = await fetch(
          '/fonts/Amiri-Regular.ttf'
        );

        if (!fontResponse.ok) {
          throw new Error(
            'Amiri font could not be loaded.'
          );
        }

        const fontBuffer =
          await fontResponse.arrayBuffer();

        const uint8Array =
          new Uint8Array(fontBuffer);

        let binary = '';

        const chunkSize = 0x8000;

        for (
          let i = 0;
          i < uint8Array.length;
          i += chunkSize
        ) {
          binary += String.fromCharCode(
            ...uint8Array.subarray(
              i,
              Math.min(
                i + chunkSize,
                uint8Array.length
              )
            )
          );
        }

        const base64 = btoa(binary);

        doc.addFileToVFS(
          'Amiri-Regular.ttf',
          base64
        );

        doc.addFont(
          'Amiri-Regular.ttf',
          'Amiri',
          'normal'
        );

        doc.setFont(
          'Amiri',
          'normal'
        );
      } catch (fontError) {
        console.error(
          'Amiri font loading error:',
          fontError
        );

        alert(
          'Arabic font could not be loaded. Please make sure Amiri-Regular.ttf exists in public/fonts/.'
        );

        return;
      }

      /*
       * ===============================================
       * INFORMATION
       * ===============================================
       */

      const schoolName =
        data.schoolName?.trim() ||
        'School Name';

      const teacherName =
        data.teacherName?.trim() ||
        'Teacher Name';

      const pageWidth =
        doc.internal.pageSize.getWidth();

      /*
       * ===============================================
       * HEADER
       * ===============================================
       */

      doc.setFont(
        'Amiri',
        'normal'
      );

      doc.setFontSize(15);

      doc.text(
        'CONTINUOUS ASSESSMENT RECORD',
        pageWidth / 2,
        14,
        {
          align: 'center',
        }
      );

      /*
       * LEFT INFORMATION
       */

      doc.setFontSize(9);

      doc.text(
        `School: ${schoolName}`,
        12,
        25
      );

      doc.text(
        `Teacher: ${teacherName}`,
        12,
        32
      );

      doc.text(
        `Class: ${className}`,
        12,
        39
      );

      /*
       * RIGHT INFORMATION
       */

      doc.text(
        `Academic Year: ${academicYear}`,
        pageWidth - 12,
        25,
        {
          align: 'right',
        }
      );

      doc.text(
        `Term: ${term}`,
        pageWidth - 12,
        32,
        {
          align: 'right',
        }
      );

      doc.text(
        `Assessment: ${
          isIntegrated
            ? 'Integrated Activities'
            : 'All Assessments'
        }`,
        pageWidth - 12,
        39,
        {
          align: 'right',
        }
      );

      /*
       * ===============================================
       * SEPARATOR
       * ===============================================
       */

      doc.setDrawColor(
        180,
        180,
        180
      );

      doc.setLineWidth(0.3);

      doc.line(
        12,
        44,
        pageWidth - 12,
        44
      );

      /*
       * ===============================================
       * TABLE HEAD
       * ===============================================
       */

      const tableHead = [
        [
          'N°',
          'Massar Code',
          'Student Name',
          'Quiz 1',
          'Quiz 2',
          'Quiz Total /20',
          'Global Test /20',
          'Integrated Activities /20',
          'Remarks',
        ],
      ];

      /*
       * ===============================================
       * TABLE BODY
       * ===============================================
       */

      const tableBody =
        classStudents.map(
          (student, index) => {
            const quiz1 =
              getAssessmentScore(
                student.id,
                'Quiz 1'
              );

            const quiz2 =
              getAssessmentScore(
                student.id,
                'Quiz 2'
              );

            const globalTest =
              getAssessmentScore(
                student.id,
                'Global Test'
              );

            const integrated =
              getIntegratedRecord(
                student.id
              );

            /*
             * Quiz 1 + Quiz 2 = /20
             */

            const quizTotal =
              quiz1 !== null &&
              quiz2 !== null
                ? quiz1 + quiz2
                : null;

            /*
             * Components used only
             * for Remarks.
             */

            const components: number[] = [];

            if (quizTotal !== null) {
              components.push(
                quizTotal
              );
            }

            if (globalTest !== null) {
              components.push(
                globalTest
              );
            }

            const integratedTotal =
              integrated?.total ?? null;

            if (
              integratedTotal !== null
            ) {
              components.push(
                integratedTotal
              );
            }

            const grade =
              components.length > 0
                ? components.reduce(
                    (
                      total,
                      value
                    ) =>
                      total + value,
                    0
                  ) /
                  components.length
                : 0;

            return [
              String(index + 1),

              student.massarCode ?? '',

              student.name,

              quiz1 !== null
                ? formatScoreOutOf(
                    quiz1,
                    10
                  )
                : '',

              quiz2 !== null
                ? formatScoreOutOf(
                    quiz2,
                    10
                  )
                : '',

              quizTotal !== null
                ? formatScoreOutOf(
                    quizTotal,
                    20
                  )
                : '',

              globalTest !== null
                ? formatScoreOutOf(
                    globalTest,
                    20
                  )
                : '',

              integratedTotal !== null
                ? formatScoreOutOf(
                    integratedTotal,
                    20
                  )
                : '',

              getRemarks(grade),
            ];
          }
        );

      /*
       * ===============================================
       * PDF TABLE
       * ===============================================
       */

      autoTable(doc, {
        head: tableHead,

        body: tableBody,

        startY: 49,

        theme: 'grid',

        styles: {
          font: 'Amiri',
          fontStyle: 'normal',
          fontSize: 7,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          cellPadding: 2,
          valign: 'middle',
          halign: 'center',
        },

        headStyles: {
          font: 'Amiri',
          fontStyle: 'normal',
          fontSize: 7,
          textColor: [0, 0, 0],
          fillColor: [242, 242, 242],
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          halign: 'center',
          valign: 'middle',
        },

        columnStyles: {
          0: {
            cellWidth: 9,
            halign: 'center',
          },

          1: {
            cellWidth: 27,
            halign: 'center',
          },

          2: {
            cellWidth: 55,
            halign: 'left',
          },

          3: {
            cellWidth: 20,
            halign: 'center',
          },

          4: {
            cellWidth: 20,
            halign: 'center',
          },

          5: {
            cellWidth: 27,
            halign: 'center',
            fontStyle: 'bold',
          },

          6: {
            cellWidth: 27,
            halign: 'center',
            fontStyle: 'bold',
          },

          7: {
            cellWidth: 36,
            halign: 'center',
            fontStyle: 'bold',
          },

          8: {
            cellWidth: 32,
            halign: 'center',
            fontStyle: 'bold',
          },
        },

        margin: {
          left: 10,
          right: 10,
          top: 49,
          bottom: 15,
        },

        didParseCell: (hookData) => {
          /*
           * Bold:
           * Quiz Total
           * Global Test
           * Integrated Activities
           * Remarks
           */

          if (
            hookData.column.index === 5 ||
            hookData.column.index === 6 ||
            hookData.column.index === 7 ||
            hookData.column.index === 8
          ) {
            hookData.cell.styles.fontStyle =
              'bold';
          }

          /*
           * Keep Amiri for all cells.
           */

          hookData.cell.styles.font =
            'Amiri';
        },

        didDrawPage: () => {
          const pageHeight =
            doc.internal.pageSize.getHeight();

          const pageNumber =
            doc.getNumberOfPages();

          doc.setFont(
            'Amiri',
            'normal'
          );

          doc.setFontSize(7);

          doc.setTextColor(
            90,
            90,
            90
          );

          doc.text(
            'Generated by Teacher Manager',
            10,
            pageHeight - 7
          );

          doc.text(
            `Page ${pageNumber}`,
            pageWidth - 10,
            pageHeight - 7,
            {
              align: 'right',
            }
          );
        },
      });

      /*
       * ===============================================
       * FILE NAME
       * ===============================================
       */

      const safeClassName =
        className
          .replace(
            /[^a-z0-9]+/gi,
            '-'
          )
          .replace(
            /^-+|-+$/g,
            ''
          ) ||
        'Class';

      const safeTerm =
        term.replace(
          /\s+/g,
          '-'
        );

      /*
       * ===============================================
       * SAVE PDF
       * ===============================================
       */

      doc.save(
        `Continuous-Assessment-${safeClassName}-${safeTerm}.pdf`
      );
    } catch (error) {
      console.error(
        'PDF generation error:',
        error
      );

      alert(
        'Could not generate the PDF file. Please check the browser console.'
      );
    }
  };

  /*
   * ===================================================
   * RENDER
   * ===================================================
   */

  return (
    <div className="min-h-full space-y-5 bg-slate-100 p-1">

      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Assessments
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage quizzes, global tests and
          integrated activities by term.
        </p>
      </div>

      {/* CONTROLS */}

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
                    key={
                      classRoom.id
                    }
                    value={
                      classRoom.id
                    }
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
              value={
                academicYear
              }
              readOnly
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
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
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
              value={
                assessmentName
              }
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
                (item) => (
                  <option
                    key={
                      item.name
                    }
                    value={
                      item.name
                    }
                  >
                    {item.name}
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

        <div className="mt-4 flex items-center rounded-lg bg-slate-50 px-4 py-3">

          <div>
            <p className="text-xs font-medium text-slate-500">
              Selected assessment
            </p>

            <p className="font-semibold text-slate-800">
              {term} ·{' '}
              {assessmentName}
            </p>
          </div>

          <span className="ml-auto rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">
            /{maxScore}
          </span>

        </div>

      </div>

      {/* ACTIONS */}

      {classId &&
        classStudents.length > 0 && (
          <>

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={save}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
              >
                <Save size={16} />

                {isIntegrated
                  ? 'Save Activities'
                  : 'Save Assessment'}
              </button>

              <button
                type="button"
                onClick={exportPDF}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Download size={16} />

                Export PDF
              </button>

              {saved && (
                <span className="text-sm font-medium text-emerald-600">
                  Saved!
                </span>
              )}

            </div>

            {/* =================================================
                INTEGRATED ACTIVITIES
                ================================================= */}

            {isIntegrated ? (

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">

                <table className="w-full text-sm">

                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">

                    <tr>

                      <th className="px-4 py-3">
                        Massar Code
                      </th>

                      <th className="px-4 py-3">
                        Name
                      </th>

                      <th className="px-4 py-3">
                        Discipline /5
                      </th>

                      <th className="px-4 py-3">
                        Participation /5
                      </th>

                      <th className="px-4 py-3">
                        Copybook /5
                      </th>

                      <th className="px-4 py-3">
                        Projects /5
                      </th>

                      <th className="px-4 py-3 font-bold">
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
                            key={
                              student.id
                            }
                            className="hover:bg-slate-50/60"
                          >

                            {/* MASSAR CODE */}

                            <td className="px-4 py-3">

                              <input
                                type="text"
                                value={
                                  student.massarCode ??
                                  ''
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateMassarCode(
                                    student.id,
                                    event.target.value
                                  )
                                }
                                placeholder="Massar Code"
                                className="w-36 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                              />

                            </td>

                            {/* NAME */}

                            <td className="px-4 py-3 text-slate-700">
                              {student.name}
                            </td>

                            {/* INTEGRATED FIELDS */}

                            {INTEGRATED_FIELDS.map(
                              (field) => {
                                const value =
                                  getIntegratedScore(
                                    student.id,
                                    field
                                  );

                                const invalid =
                                  invalidIntegrated(
                                    value
                                  );

                                return (
                                  <td
                                    key={
                                      field
                                    }
                                    className="px-4 py-3"
                                  >

                                    <input
                                      type="number"
                                      min="0"
                                      max="5"
                                      step="0.5"
                                      value={
                                        value
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateIntegratedScore(
                                          student.id,
                                          field,
                                          event.target.value
                                        )
                                      }
                                      className={`w-20 rounded-lg border px-2 py-1.5 text-sm outline-none ${
                                        invalid
                                          ? 'border-rose-500 bg-rose-50'
                                          : 'border-slate-300'
                                      }`}
                                    />

                                  </td>
                                );
                              }
                            )}

                            {/* TOTAL */}

                            <td className="px-4 py-3 font-bold">
                              {formatScore(
                                total
                              )}
                              /20
                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            ) : (

              /* =================================================
                 NORMAL ASSESSMENT
                 ================================================= */

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">

                <table className="w-full text-sm">

                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">

                    <tr>

                      <th className="px-4 py-3">
                        Massar Code
                      </th>

                      <th className="px-4 py-3">
                        Name
                      </th>

                      <th className="px-4 py-3">
                        Score /{maxScore}
                      </th>

                      <th className="px-4 py-3">
                        Percentage
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {classStudents.map(
                      (student) => {

                        const raw =
                          draft[
                            student.id
                          ] ?? '';

                        const score =
                          Number(raw);

                        const hasScore =
                          raw.trim() !== '';

                        const valid =
                          Number.isFinite(
                            score
                          );

                        const invalid =
                          hasScore &&
                          (
                            !valid ||
                            score < 0 ||
                            score > maxScore
                          );

                        const percentage =
                          hasScore &&
                          valid &&
                          !invalid
                            ? (
                                (score /
                                  maxScore) *
                                100
                              ).toFixed(1)
                            : null;

                        return (
                          <tr
                            key={
                              student.id
                            }
                            className="hover:bg-slate-50/60"
                          >

                            {/* MASSAR CODE */}

                            <td className="px-4 py-3">

                              <input
                                type="text"
                                value={
                                  student.massarCode ??
                                  ''
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateMassarCode(
                                    student.id,
                                    event.target.value
                                  )
                                }
                                placeholder="Massar Code"
                                className="w-36 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                              />

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
                                max={
                                  maxScore
                                }
                                step="0.5"
                                value={
                                  raw
                                }
                                onChange={(
                                  event
                                ) =>
                                  setScore(
                                    student.id,
                                    event.target.value
                                  )
                                }
                                className={`w-24 rounded-lg border px-2 py-1.5 text-sm outline-none ${
                                  invalid
                                    ? 'border-rose-400 bg-rose-50'
                                    : 'border-slate-300'
                                }`}
                              />

                              {invalid && (
                                <p className="mt-1 text-xs text-rose-600">
                                  Score must be between 0 and{' '}
                                  {maxScore}
                                </p>
                              )}

                            </td>

                            {/* PERCENTAGE */}

                            <td className="px-4 py-3 text-slate-600">
                              {percentage !==
                              null
                                ? `${percentage}%`
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

      {/* EMPTY CLASS */}

      {classId &&
        classStudents.length === 0 && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            The class {className} has no
            students yet.
          </p>
        )}

      {/* NO CLASS */}

      {!classId && (
        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Select a class to enter
          assessment grades.
        </p>
      )}

    </div>
  );
}