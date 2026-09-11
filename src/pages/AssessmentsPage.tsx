import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useData } from '@/store/DataContext';

import type {
  AssessmentRecord,
  IntegratedActivityRecord,
  DiagnosticTestRecord,
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
  | 'Integrated Activities'
  | 'Diagnostic Test';

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

// PDF identity used by the teacher's current school record.
const PDF_SCHOOL_NAME = 'Collège Saleh El-Ouardani';
const PDF_TEACHER_NAME = 'Ossama Lachgar';

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

  type AssessmentExportChoice =
    | 'all'
    | 'official'
    | 'Quiz 1'
    | 'Quiz 2'
    | 'Global Test'
    | 'Integrated Activities';

  const [exportChoice, setExportChoice] =
    useState<AssessmentExportChoice>('all');

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

  const diagnosticTests =
    data.diagnosticTests ?? [];

  const isIntegrated =
    assessmentName === 'Integrated Activities';

  const isDiagnostic =
    assessmentName === 'Diagnostic Test';

  const selectedAssessment =
    ASSESSMENTS.find(
      (item) =>
        item.name === assessmentName
    );

  const maxScore =
    isDiagnostic
      ? 20
      : selectedAssessment?.maxScore ?? 20;

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
    if (isIntegrated || isDiagnostic) {
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
    isDiagnostic,
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
   * LOAD DIAGNOSTIC TEST
   * ===================================================
   */

  useEffect(() => {
    if (!isDiagnostic) {
      return;
    }

    const newDraft: ScoreDraft = {};

    for (const student of classStudents) {
      const existing =
        diagnosticTests.find(
          (diagnostic) =>
            diagnostic.studentId === student.id &&
            diagnostic.classId === classId &&
            diagnostic.academicYear === academicYear &&
            diagnostic.term === term
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
    diagnosticTests,
    classId,
    academicYear,
    term,
    isDiagnostic,
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
     * DIAGNOSTIC TEST
     * =================================================
     */

    if (isDiagnostic) {
      const errors: string[] = [];
      const records: DiagnosticTestRecord[] = [];
      const idBase = Date.now();

      for (
        let index = 0;
        index < classStudents.length;
        index++
      ) {
        const student = classStudents[index];
        const raw = draft[student.id];

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
          score > 20
        ) {
          errors.push(
            `${student.name}: diagnostic score must be between 0 and 20`
          );
          continue;
        }

        const existing =
          diagnosticTests.find(
            (diagnostic) =>
              diagnostic.studentId === student.id &&
              diagnostic.classId === classId &&
              diagnostic.academicYear === academicYear &&
              diagnostic.term === term
          );

        records.push({
          id:
            existing?.id ??
            `D-${idBase}-${index}`,
          studentId: student.id,
          classId,
          academicYear,
          date,
          term,
          score,
          maxScore: 20,
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
          'No diagnostic scores entered to save.'
        );
        return;
      }

      setData((previous) => {
        const current =
          previous.diagnosticTests ?? [];

        const kept = current.filter(
          (diagnostic) =>
            !(
              diagnostic.classId === classId &&
              diagnostic.academicYear === academicYear &&
              diagnostic.term === term
            )
        );

        return {
          ...previous,
          diagnosticTests: [
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

  const getDiagnosticScore = (
    studentId: string
  ) => {
    const record =
      diagnosticTests.find(
        (diagnostic) =>
          diagnostic.studentId === studentId &&
          diagnostic.classId === classId &&
          diagnostic.academicYear === academicYear &&
          diagnostic.term === term
      );

    return record?.score ?? null;
  };

  /*
   * ===================================================
   * PDF EXPORT
   * ===================================================
   */

  /*
   * ===================================================
   * DIAGNOSTIC TEST PDF
   * ===================================================
   */

  const exportDiagnosticPDF = async () => {
    if (!classId) {
      alert('Please select a class.');
      return;
    }

    if (!academicYear) {
      alert('This class has no academic year.');
      return;
    }

    if (classStudents.length === 0) {
      alert('This class has no students.');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

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
          const end = Math.min(
            i + chunkSize,
            uint8Array.length
          );

          for (let j = i; j < end; j += 1) {
            binary += String.fromCharCode(
              uint8Array[j]
            );
          }
        }

        doc.addFileToVFS(
          'Amiri-Regular.ttf',
          btoa(binary)
        );

        doc.addFont(
          'Amiri-Regular.ttf',
          'Amiri',
          'normal'
        );

        doc.setFont('Amiri', 'normal');
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

      const schoolName = PDF_SCHOOL_NAME;

      const teacherName = PDF_TEACHER_NAME;

      const pageWidth =
        doc.internal.pageSize.getWidth();

      doc.setFont('Amiri', 'normal');
      doc.setFontSize(15);

      doc.text(
        'DIAGNOSTIC TEST RECORD',
        pageWidth / 2,
        14,
        { align: 'center' }
      );

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

      doc.text(
        `Academic Year: ${academicYear}`,
        pageWidth - 12,
        25,
        { align: 'right' }
      );

      doc.text(
        `Term: ${term}`,
        pageWidth - 12,
        32,
        { align: 'right' }
      );

      doc.text(
        `Date: ${date}`,
        pageWidth - 12,
        39,
        { align: 'right' }
      );

      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);

      doc.line(
        12,
        44,
        pageWidth - 12,
        44
      );

      const tableHead = [[
        'N°',
        'Massar Code',
        'Student Name',
        'Diagnostic Test /20',
        'Percentage',
      ]];

      const tableBody =
        classStudents.map(
          (student, index) => {
            const score =
              getDiagnosticScore(
                student.id
              );

            const percentage =
              score !== null
                ? `${(
                    (score / 20) *
                    100
                  ).toFixed(1)}%`
                : '';

            return [
              String(index + 1),
              student.massarCode ?? '',
              student.name,
              score !== null
                ? formatScoreOutOf(
                    score,
                    20
                  )
                : '',
              percentage,
            ];
          }
        );

      autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 49,
        theme: 'grid',
        styles: {
          font: 'Amiri',
          fontStyle: 'normal',
          fontSize: 8,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          cellPadding: 2.5,
          valign: 'middle',
          halign: 'center',
        },
        headStyles: {
          font: 'Amiri',
          fontStyle: 'normal',
          fontSize: 8,
          textColor: [0, 0, 0],
          fillColor: [242, 242, 242],
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          halign: 'center',
          valign: 'middle',
        },
        columnStyles: {
          0: {
            cellWidth: 15,
            halign: 'center',
          },
          1: {
            cellWidth: 45,
            halign: 'center',
          },
          2: {
            cellWidth: 100,
            halign: 'left',
          },
          3: {
            cellWidth: 45,
            halign: 'center',
            fontStyle: 'normal',
          },
          4: {
            cellWidth: 35,
            halign: 'center',
          },
        },
        margin: {
          left: 10,
          right: 10,
          top: 49,
          bottom: 15,
        },
        didParseCell: (hookData) => {
          if (hookData.column.index === 3) {
            hookData.cell.styles.fontStyle =
              'bold';
          }

          hookData.cell.styles.font =
            'Amiri';
        },
        didDrawPage: () => {
          const pageHeight =
            doc.internal.pageSize.getHeight();

          const pageNumber =
            doc.getNumberOfPages();

          doc.setFont('Amiri', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(90, 90, 90);

          doc.text(
            `Page ${pageNumber}`,
            pageWidth - 10,
            pageHeight - 7,
            { align: 'right' }
          );
        },
      });

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

      doc.save(
        `Diagnostic-Test-${safeClassName}-${safeTerm}.pdf`
      );
    } catch (error) {
      console.error(
        'Diagnostic PDF generation error:',
        error
      );

      alert(
        'Could not generate the diagnostic PDF file. Please check the browser console.'
      );
    }
  };

  const exportAssessmentPDF = async (
    choice: AssessmentExportChoice
  ) => {
    if (!classId) {
      alert('Please select a class.');
      return;
    }

    if (!academicYear) {
      alert('This class has no academic year.');
      return;
    }

    if (classStudents.length === 0) {
      alert('This class has no students.');
      return;
    }

    try {
      const doc = new jsPDF({
        // Personal sheet stays portrait; official school sheet uses
        // landscape so all 12 official columns fit on one page.
        orientation:
          choice === 'official'
            ? 'landscape'
            : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Load a Unicode font so Arabic student names are preserved.
      // The byte conversion deliberately avoids the spread operator because
      // spreading a large Uint8Array can trigger STATUS_STACK_OVERFLOW.
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
          const end = Math.min(
            i + chunkSize,
            uint8Array.length
          );

          for (let j = i; j < end; j += 1) {
            binary += String.fromCharCode(
              uint8Array[j]
            );
          }
        }

        doc.addFileToVFS(
          'Amiri-Regular.ttf',
          btoa(binary)
        );
        doc.addFont(
          'Amiri-Regular.ttf',
          'Amiri',
          'normal'
        );
        doc.setFont('Amiri', 'normal');
      } catch (fontError) {
        console.error(
          'Assessment PDF font loading error:',
          fontError
        );

        alert(
          'Arabic font could not be loaded. Please make sure Amiri-Regular.ttf exists in public/fonts/.'
        );
        return;
      }

      /*
       * =================================================
       * DESIGN SYSTEM
       * =================================================
       */
      const NAVY: [number, number, number] = [15, 42, 78];
      const NAVY_DARK: [number, number, number] = [9, 30, 57];
      const GOLD: [number, number, number] = [190, 145, 70];
      const GOLD_LIGHT: [number, number, number] = [232, 214, 175];
      const CREAM: [number, number, number] = [250, 247, 239];
      const RED: [number, number, number] = [170, 30, 40];
      const GREEN: [number, number, number] = [0, 110, 70];
      const SKY: [number, number, number] = [221, 232, 242];

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 7;

      const schoolName = PDF_SCHOOL_NAME;
      const teacherName = PDF_TEACHER_NAME;

      const safeClassName =
        className
          .replace(/[^a-z0-9]+/gi, '-')
          .replace(/^-+|-+$/g, '') || 'Class';

      const safeTerm = term.replace(/\s+/g, '-');

      const drawMoroccoFlag = (x: number, y: number, w: number, h: number) => {
        doc.setFillColor(...RED);
        doc.rect(x, y, w, h, 'F');

        const cx = x + w / 2;
        const cy = y + h / 2;
        const r1 = Math.min(w, h) * 0.28;
        const r2 = r1 * 0.38;
        const points: Array<[number, number]> = [];

        for (let i = 0; i < 10; i += 1) {
          const angle = -Math.PI / 2 + (i * Math.PI) / 5;
          const r = i % 2 === 0 ? r1 : r2;
          points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
        }

        doc.setDrawColor(...GREEN);
        doc.setLineWidth(0.6);
        for (let i = 0; i < points.length; i += 1) {
          const [x1, y1] = points[i];
          const [x2, y2] = points[(i + 1) % points.length];
          doc.line(x1, y1, x2, y2);
        }
      };

      const drawUKFlag = (x: number, y: number, w: number, h: number) => {
        doc.setFillColor(20, 45, 90);
        doc.rect(x, y, w, h, 'F');

        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(Math.max(1.8, h * 0.22));
        doc.line(x, y, x + w, y + h);
        doc.line(x + w, y, x, y + h);

        doc.setDrawColor(...RED);
        doc.setLineWidth(Math.max(0.8, h * 0.09));
        doc.line(x, y, x + w, y + h);
        doc.line(x + w, y, x, y + h);

        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(Math.max(2.5, h * 0.30));
        doc.line(x + w / 2, y, x + w / 2, y + h);
        doc.line(x, y + h / 2, x + w, y + h / 2);

        doc.setDrawColor(...RED);
        doc.setLineWidth(Math.max(1.2, h * 0.13));
        doc.line(x + w / 2, y, x + w / 2, y + h);
        doc.line(x, y + h / 2, x + w, y + h / 2);
      };

      const drawMoroccanTower = (x: number, baseY: number, scale: number) => {
        doc.setFillColor(...GOLD_LIGHT);
        doc.rect(x, baseY - 25 * scale, 9 * scale, 25 * scale, 'F');
        doc.setFillColor(...GOLD);
        doc.rect(x - 1 * scale, baseY - 27 * scale, 11 * scale, 2 * scale, 'F');
        doc.setFillColor(...GREEN);
        doc.rect(x + 2.2 * scale, baseY - 22 * scale, 4.6 * scale, 4.5 * scale, 'F');
        doc.setFillColor(...GOLD);
        doc.rect(x + 3 * scale, baseY - 12 * scale, 3 * scale, 7 * scale, 'F');
        doc.setFillColor(...GREEN);
        doc.rect(x - 2 * scale, baseY - 30 * scale, 13 * scale, 3 * scale, 'F');
        doc.setFillColor(...GOLD);
        doc.triangle(
          x + 4.5 * scale,
          baseY - 35 * scale,
          x - 1 * scale,
          baseY - 30 * scale,
          x + 10 * scale,
          baseY - 30 * scale,
          'F'
        );
      };

      const drawBigBen = (x: number, baseY: number, scale: number) => {
        doc.setFillColor(...SKY);
        doc.rect(x, baseY - 27 * scale, 8 * scale, 27 * scale, 'F');
        doc.setFillColor(...NAVY);
        doc.rect(x - 1 * scale, baseY - 29 * scale, 10 * scale, 2 * scale, 'F');
        doc.triangle(
          x - 1 * scale,
          baseY - 29 * scale,
          x + 4 * scale,
          baseY - 36 * scale,
          x + 9 * scale,
          baseY - 29 * scale,
          'F'
        );
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.5 * scale);
        doc.circle(x + 4 * scale, baseY - 20 * scale, 2.2 * scale, 'S');
        doc.line(x + 4 * scale, baseY - 20 * scale, x + 4 * scale, baseY - 21.5 * scale);
        doc.line(x + 4 * scale, baseY - 20 * scale, x + 5.3 * scale, baseY - 20 * scale);
        doc.setFillColor(...NAVY);
        doc.rect(x + 2.5 * scale, baseY - 10 * scale, 3 * scale, 10 * scale, 'F');
      };

      const drawHeader = () => {
        doc.setFillColor(...CREAM);
        doc.rect(0, 0, pageWidth, 52, 'F');

        doc.setFillColor(...NAVY);
        doc.rect(0, 0, pageWidth, 3, 'F');

        drawMoroccoFlag(8, 7, 22, 14);
        drawUKFlag(pageWidth - 30, 7, 22, 14);

        drawMoroccanTower(14, 43, 0.8);
        drawBigBen(pageWidth - 22, 43, 0.8);

        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.5);
        doc.line(37, 13, 72, 13);
        doc.line(pageWidth - 72, 13, pageWidth - 37, 13);

        doc.setFillColor(...GOLD);
        doc.circle(75, 13, 1, 'F');
        doc.circle(pageWidth - 75, 13, 1, 'F');

        // Academic cap icon.
        doc.setFillColor(...GOLD);
        doc.triangle(
          pageWidth / 2 - 7,
          8,
          pageWidth / 2,
          4,
          pageWidth / 2 + 7,
          8,
          'F'
        );
        doc.rect(pageWidth / 2 - 5, 8, 10, 2.2, 'F');
        doc.setLineWidth(0.7);
        doc.line(pageWidth / 2 + 5, 8, pageWidth / 2 + 7, 14);
        doc.circle(pageWidth / 2 + 7, 14, 0.8, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(17);
        doc.setTextColor(...NAVY);
        doc.text('SEMESTRIAL GRADING SHEET', pageWidth / 2, 25, {
          align: 'center',
        });

        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.45);
        doc.line(45, 29, pageWidth - 45, 29);
        doc.circle(pageWidth / 2, 29, 1.4, 'S');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...NAVY_DARK);
        doc.text(schoolName, pageWidth / 2, 34, { align: 'center' });
        doc.text(`Teacher: ${teacherName}`, pageWidth / 2, 38.5, { align: 'center' });

        // Information boxes.
        const boxY = 41.5;
        const boxH = 7.5;
        const boxW = 57;

        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.45);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(20, boxY, boxW, boxH, 1.5, 1.5, 'FD');
        doc.roundedRect(pageWidth - 20 - boxW, boxY, boxW, boxH, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...NAVY);
        doc.text(`Semester : ${term}`, 23, boxY + 5, { align: 'left' });
        doc.text(`Class : ${className}`, pageWidth - 23, boxY + 5, { align: 'right' });
      };

      const drawFooter = (pageNumber: number) => {
        const y = pageHeight - 13;

        doc.setFillColor(...NAVY_DARK);
        doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');

        // Moroccan-inspired ribbon.
        doc.setDrawColor(...RED);
        doc.setLineWidth(2.2);
        doc.line(0, y + 1, pageWidth, y + 1);
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(1.2);
        doc.line(0, y + 3.2, pageWidth, y + 3.2);
        doc.setDrawColor(...GREEN);
        doc.setLineWidth(1.2);
        doc.line(0, y + 5.2, pageWidth, y + 5.2);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);
        doc.text(`Page ${pageNumber}`, pageWidth - 8, pageHeight - 3.3, {
          align: 'right',
        });
      };

      const applyBaseFont = () => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
      };

      /*
       * =================================================
       * HEADER
       * =================================================
       */
      drawHeader();

      /*
       * =================================================
       * OFFICIAL SCHOOL SHEET
       * =================================================
       */
      if (choice === 'official') {
        const OFFICIAL_ROW_COUNT = Math.max(39, classStudents.length);

        const officialHead = [
          [
            { content: 'N°', rowSpan: 2 },
            { content: "Students' names", rowSpan: 2 },
            { content: 'Diagnostic Test', rowSpan: 2 },
            { content: 'INTEGRATED ACTIVITIES', colSpan: 5 },
            { content: 'Quizzes & Global Test', colSpan: 4 },
          ],
          [
            'Discipline\n/5',
            'Participation\n/5',
            'Copybook\n/5',
            'Projects\n/5',
            'Total\n/20',
            'Q : 1',
            'Q : 2',
            'Total\n(Q1 + Q2)',
            'G. Test',
          ],
        ];

        const officialBody = Array.from(
          { length: OFFICIAL_ROW_COUNT },
          (_, index) => {
            const student = classStudents[index];

            if (!student) {
              return [
                String(index + 1),
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
              ];
            }

            const diagnostic = getDiagnosticScore(student.id);
            const quiz1 = getAssessmentScore(student.id, 'Quiz 1');
            const quiz2 = getAssessmentScore(student.id, 'Quiz 2');
            const globalTest = getAssessmentScore(student.id, 'Global Test');
            const integrated = getIntegratedRecord(student.id);
            const integratedTotal = integrated
              ? (Number(integrated.discipline) || 0) +
                (Number(integrated.participation) || 0) +
                (Number(integrated.copybook) || 0) +
                (Number(integrated.projects) || 0)
              : null;

            const quizTotal =
              quiz1 !== null && quiz2 !== null
                ? quiz1 + quiz2
                : null;

            return [
              String(index + 1),
              student.name,
              diagnostic !== null ? formatScoreOutOf(diagnostic, 20) : '',
              integrated ? formatScore(integrated.discipline) : '',
              integrated ? formatScore(integrated.participation) : '',
              integrated ? formatScore(integrated.copybook) : '',
              integrated ? formatScore(integrated.projects) : '',
              integratedTotal !== null ? formatScore(integratedTotal) : '',
              quiz1 !== null ? formatScoreOutOf(quiz1, 10) : '',
              quiz2 !== null ? formatScoreOutOf(quiz2, 10) : '',
              quizTotal !== null ? formatScoreOutOf(quizTotal, 20) : '',
              globalTest !== null ? formatScoreOutOf(globalTest, 20) : '',
            ];
          }
        );

        const leftX = 10;
        const topY = 8;

        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        doc.setDrawColor(20, 20, 20);
        doc.setLineWidth(0.5);
        doc.rect(4, 4, pageWidth - 8, pageHeight - 8, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(20, 20, 20);
        doc.text('Teacher:', leftX, topY + 5);
        doc.text('H. School:', leftX, topY + 9);
        doc.text('Total N° of students:', leftX, topY + 13);
        doc.text('Academic year:', leftX, topY + 17);

        doc.setFont('helvetica', 'normal');
        doc.text(teacherName, leftX + 28, topY + 5);
        doc.text(schoolName, leftX + 28, topY + 9);
        doc.text(String(classStudents.length), leftX + 38, topY + 13);
        doc.text(academicYear, leftX + 28, topY + 17);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`Class: ${className}`, pageWidth - 10, topY + 5, { align: 'right' });
        doc.text(`SEMESTER : ${term.toUpperCase()}`, pageWidth - 10, topY + 13, { align: 'right' });

        // Simple official-style centre mark instead of an external logo asset.
        doc.setDrawColor(70, 70, 70);
        doc.setLineWidth(0.35);
        doc.line(pageWidth / 2 - 22, 24, pageWidth / 2 + 22, 24);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('SEMESTRIAL GRADING SHEET', pageWidth / 2, 22, { align: 'center' });

        autoTable(doc, {
          head: officialHead,
          body: officialBody,
          startY: 29,
          margin: { left: 7, right: 7, bottom: 8 },
          theme: 'grid',
          tableWidth: pageWidth - 14,
          styles: {
            font: 'helvetica',
            fontStyle: 'normal',
            fontSize: 6.5,
            textColor: [20, 20, 20],
            lineColor: [45, 45, 45],
            lineWidth: 0.2,
            cellPadding: 0.7,
            minCellHeight: 3.75,
            valign: 'middle',
            halign: 'center',
          },
          headStyles: {
            font: 'helvetica',
            fontStyle: 'bold',
            fontSize: 6.2,
            textColor: [20, 20, 20],
            fillColor: [232, 229, 216],
            lineColor: [45, 45, 45],
            lineWidth: 0.25,
            halign: 'center',
            valign: 'middle',
            cellPadding: 1,
          },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 70, halign: 'left' },
            2: { cellWidth: 21, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 20, halign: 'center' },
            6: { cellWidth: 20, halign: 'center' },
            7: { cellWidth: 21, halign: 'center' },
            8: { cellWidth: 16, halign: 'center' },
            9: { cellWidth: 16, halign: 'center' },
            10: { cellWidth: 24, halign: 'center' },
            11: { cellWidth: 22, halign: 'center' },
          },
          didParseCell: (hookData) => {
            if (hookData.section === 'body' && hookData.column.index === 1) {
              hookData.cell.styles.font = 'Amiri';
              hookData.cell.styles.fontStyle = 'normal';
            }

            if (hookData.section === 'head') {
              if (hookData.row.index === 0) {
                hookData.cell.styles.fillColor = [224, 221, 207];
              }
            }
          },
          didDrawPage: () => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(80, 80, 80);
            doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - 8, pageHeight - 4, { align: 'right' });
          },
        });

        doc.save(`Official-Grading-Sheet-${safeClassName}-${safeTerm}.pdf`);
        return;
      }

      /*
       * =================================================
       * ALL ASSESSMENTS
       * =================================================
       * This is the main Semestrial Grading Sheet design.
       */
      if (choice === 'all') {
        const tableHead = [
          [
            { content: 'No.', rowSpan: 2 },
            { content: "Student's Name", rowSpan: 2 },
            { content: 'INTEGRATED ACTIVITIES', colSpan: 5 },
            { content: 'CONTINUOUS ASSESSMENT', colSpan: 4 },
            { content: 'REMARK', rowSpan: 2 },
          ],
          [
            'Discipline\n/5',
            'Participation\n/5',
            'Copybook\n/5',
            'Projects\n/5',
            'Total\n/20',
            'Quiz 1',
            'Quiz 2',
            'Full Mark\n(Q1 + Q2)',
            'Global Test',
          ],
        ];

        const tableBody = classStudents.map((student, index) => {
          const quiz1 = getAssessmentScore(student.id, 'Quiz 1');
          const quiz2 = getAssessmentScore(student.id, 'Quiz 2');
          const globalTest = getAssessmentScore(student.id, 'Global Test');
          const integrated = getIntegratedRecord(student.id);

          const quizTotal =
            quiz1 !== null && quiz2 !== null ? quiz1 + quiz2 : null;

          const integratedTotal = integrated
            ? (Number(integrated.discipline) || 0) +
              (Number(integrated.participation) || 0) +
              (Number(integrated.copybook) || 0) +
              (Number(integrated.projects) || 0)
            : null;

          const components: number[] = [];
          if (quizTotal !== null) components.push(quizTotal);
          if (globalTest !== null) components.push(globalTest);
          if (integratedTotal !== null) components.push(integratedTotal);

          const overallGrade =
            components.length > 0
              ? components.reduce((sum, value) => sum + value, 0) / components.length
              : null;

          const remark =
            overallGrade === null
              ? ''
              : overallGrade >= 16
                ? 'Excellent'
                : overallGrade >= 14
                  ? 'Very Good'
                  : overallGrade >= 12
                    ? 'Good'
                    : overallGrade >= 10
                      ? 'Satisfactory'
                      : 'Needs Improvement';

          return [
            String(index + 1),
            student.name,
            integrated ? formatScore(integrated.discipline) : '',
            integrated ? formatScore(integrated.participation) : '',
            integrated ? formatScore(integrated.copybook) : '',
            integrated ? formatScore(integrated.projects) : '',
            integratedTotal !== null ? formatScoreOutOf(integratedTotal, 20) : '',
            quiz1 !== null ? formatScoreOutOf(quiz1, 10) : '',
            quiz2 !== null ? formatScoreOutOf(quiz2, 10) : '',
            quizTotal !== null ? formatScoreOutOf(quizTotal, 20) : '',
            globalTest !== null ? formatScoreOutOf(globalTest, 20) : '',
            remark,
          ];
        });

        autoTable(doc, {
          head: tableHead,
          body: tableBody,
          startY: 56,
          margin: {
            left: margin,
            right: margin,
            bottom: 13,
          },
          theme: 'grid',
          tableWidth: pageWidth - margin * 2,
          styles: {
            font: 'helvetica',
            fontStyle: 'normal',
            fontSize: 6.7,
            textColor: [25, 25, 25],
            lineColor: GOLD_LIGHT,
            lineWidth: 0.25,
            cellPadding: 1.35,
            minCellHeight: 5.4,
            valign: 'middle',
            halign: 'center',
          },
          headStyles: {
            font: 'helvetica',
            fontStyle: 'normal',
            fontSize: 6.5,
            textColor: [255, 255, 255],
            fillColor: NAVY,
            lineColor: [255, 255, 255],
            lineWidth: 0.25,
            halign: 'center',
            valign: 'middle',
            cellPadding: 1.5,
          },
          alternateRowStyles: {
            fillColor: [255, 252, 245],
          },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 53, halign: 'left' },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 17, halign: 'center' },
            4: { cellWidth: 15, halign: 'center' },
            5: { cellWidth: 15, halign: 'center' },
            6: { cellWidth: 18, halign: 'center' },
            7: { cellWidth: 13, halign: 'center' },
            8: { cellWidth: 13, halign: 'center' },
            9: { cellWidth: 20, halign: 'center', fontStyle: 'normal' },
            10: { cellWidth: 16, halign: 'center', fontStyle: 'normal' },
            11: { cellWidth: 28, halign: 'left', fontStyle: 'normal' },
          },
          didParseCell: (hookData) => {
            hookData.cell.styles.font = 'helvetica';

            if (hookData.section === 'body' && hookData.column.index === 1) {
              hookData.cell.styles.font = 'Amiri';
            }

            if (hookData.section === 'head') {
              if (hookData.row.index === 0 && hookData.column.index >= 2) {
                hookData.cell.styles.fillColor = NAVY_DARK;
              }

              if (
                hookData.row.index === 1 &&
                hookData.column.index >= 2 &&
                hookData.column.index <= 5
              ) {
                hookData.cell.styles.fillColor = [33, 67, 105];
              }
            }

            if (hookData.section === 'body') {
              if (hookData.column.index >= 7 && hookData.column.index <= 10) {
                hookData.cell.styles.fontStyle = 'normal';
                hookData.cell.styles.textColor = NAVY_DARK;
              }

              if (hookData.column.index === 11) {
                hookData.cell.styles.fontStyle = 'normal';
                hookData.cell.styles.textColor = NAVY_DARK;
              }
            }
          },
          didDrawPage: () => {
            applyBaseFont();
            drawFooter(doc.getNumberOfPages());
          },
        });

        doc.save(`Semestrial-Grading-Sheet-${safeClassName}-${safeTerm}.pdf`);
        return;
      }

      /*
       * =================================================
       * INTEGRATED ACTIVITIES ONLY
       * =================================================
       */
      if (choice === 'Integrated Activities') {
        const tableHead = [[
          'No.',
          "Student's Name",
          'Discipline /5',
          'Participation /5',
          'Copybook /5',
          'Projects /5',
          'Total /20',
        ]];

        const tableBody = classStudents.map((student, index) => {
          const integrated = getIntegratedRecord(student.id);

          return [
            String(index + 1),
            student.name,
            integrated ? formatScore(integrated.discipline) : '',
            integrated ? formatScore(integrated.participation) : '',
            integrated ? formatScore(integrated.copybook) : '',
            integrated ? formatScore(integrated.projects) : '',
            integrated ? formatScoreOutOf(integrated.total, 20) : '',
          ];
        });

        autoTable(doc, {
          head: tableHead,
          body: tableBody,
          startY: 56,
          margin: { left: margin, right: margin, bottom: 13 },
          theme: 'grid',
          tableWidth: pageWidth - margin * 2,
          styles: {
            font: 'helvetica',
            fontSize: 7,
            textColor: [25, 25, 25],
            lineColor: GOLD_LIGHT,
            lineWidth: 0.25,
            cellPadding: 1.8,
            minCellHeight: 6,
            valign: 'middle',
            halign: 'center',
          },
          headStyles: {
            font: 'helvetica',
            fontStyle: 'normal',
            fontSize: 7,
            textColor: [255, 255, 255],
            fillColor: NAVY,
            lineColor: [255, 255, 255],
            lineWidth: 0.25,
          },
          alternateRowStyles: { fillColor: [255, 252, 245] },
          didParseCell: (hookData) => {
            hookData.cell.styles.font = 'helvetica';
            if (hookData.section === 'body' && hookData.column.index === 1) {
              hookData.cell.styles.font = 'Amiri';
            }
          },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 70, halign: 'left' },
            2: { cellWidth: 24 },
            3: { cellWidth: 28 },
            4: { cellWidth: 24 },
            5: { cellWidth: 24 },
            6: { cellWidth: 18, fontStyle: 'normal' },
          },
          didDrawPage: () => {
            applyBaseFont();
            drawFooter(doc.getNumberOfPages());
          },
        });

        doc.save(`Integrated-Activities-${safeClassName}-${safeTerm}.pdf`);
        return;
      }

      /*
       * =================================================
       * INDIVIDUAL OFFICIAL ASSESSMENT
       * =================================================
       */
      const max = choice === 'Quiz 1' || choice === 'Quiz 2' ? 10 : 20;

      const tableHead = [[
        'No.',
        "Student's Name",
        `${choice} /${max}`,
        'Percentage',
      ]];

      const tableBody = classStudents.map((student, index) => {
        const score = getAssessmentScore(student.id, choice as OfficialAssessment);
        const percentage =
          score !== null ? `${((score / max) * 100).toFixed(1)}%` : '';

        return [
          String(index + 1),
          student.name,
          score !== null ? formatScoreOutOf(score, max) : '',
          percentage,
        ];
      });

      autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 56,
        margin: { left: margin, right: margin, bottom: 13 },
        theme: 'grid',
        tableWidth: pageWidth - margin * 2,
        styles: {
          font: 'helvetica',
          fontSize: 7.5,
          textColor: [25, 25, 25],
          lineColor: GOLD_LIGHT,
          lineWidth: 0.25,
          cellPadding: 2,
          minCellHeight: 6,
          valign: 'middle',
          halign: 'center',
        },
        headStyles: {
          font: 'helvetica',
          fontStyle: 'normal',
          fontSize: 7.5,
          textColor: [255, 255, 255],
          fillColor: NAVY,
          lineColor: [255, 255, 255],
          lineWidth: 0.25,
        },
        alternateRowStyles: { fillColor: [255, 252, 245] },
        didParseCell: (hookData) => {
          hookData.cell.styles.font = 'helvetica';
          if (hookData.section === 'body' && hookData.column.index === 1) {
            hookData.cell.styles.font = 'Amiri';
          }
        },
        columnStyles: {
          0: { cellWidth: 14 },
          1: { cellWidth: 105, halign: 'left' },
          2: { cellWidth: 35, fontStyle: 'normal' },
          3: { cellWidth: 35 },
        },
        didDrawPage: () => {
          applyBaseFont();
          drawFooter(doc.getNumberOfPages());
        },
      });

      doc.save(
        `${choice.replace(/\s+/g, '-')}-${safeClassName}-${safeTerm}.pdf`
      );
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Could not generate the PDF file. Please check the browser console.');
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
          Manage quizzes, global tests, integrated activities and diagnostic tests by term.
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

              <option value="Diagnostic Test">
                Diagnostic Test
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
                  : isDiagnostic
                    ? 'Save Diagnostic'
                    : 'Save Assessment'}
              </button>

              {isDiagnostic ? (
                <button
                  type="button"
                  onClick={
                    exportDiagnosticPDF
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Download size={16} />

                  Export Diagnostic PDF
                </button>
              ) : (
                <>
                  <select
                    value={exportChoice}
                    onChange={(event) =>
                      setExportChoice(
                        event.target
                          .value as AssessmentExportChoice
                      )
                    }
                    className="form-select w-auto min-w-[190px]"
                  >
                    <option value="all">
                      Personal Grading Sheet
                    </option>
                    <option value="official">
                      Official School Sheet
                    </option>
                    <option value="Quiz 1">
                      Quiz 1
                    </option>
                    <option value="Quiz 2">
                      Quiz 2
                    </option>
                    <option value="Global Test">
                      Global Test
                    </option>
                    <option value="Integrated Activities">
                      Integrated Activities
                    </option>
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      exportAssessmentPDF(
                        exportChoice
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Download size={16} />

                    Export PDF
                  </button>
                </>
              )}

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
                 NORMAL ASSESSMENT / DIAGNOSTIC TEST
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
                        {isDiagnostic
                          ? 'Diagnostic Score /20'
                          : `Score /${maxScore}`}
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
          Select a class to enter grades.
        </p>
      )}

    </div>
  );
}