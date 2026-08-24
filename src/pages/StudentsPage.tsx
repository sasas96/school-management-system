import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';

import * as XLSX from 'xlsx';

import { useData } from '@/store/DataContext';

import type {
  Gender,
  Student,
  ClassRoom,
  LearningStyle,
  LearningPreference,
  ParticipationLevel,
  LearningBehaviour,
  MotivationLevel,
  SkillLevel,
} from '@/types';

import { nextStudentId } from '@/lib/storage';

import {
  summarizeStudent,
  fmtPct,
} from '@/lib/calculations';

import { Modal } from '@/components/Modal';
import { Field } from '@/pages/ClassesPage';
import { StatusBadge } from '@/components/Badges';
import { StudentProfile } from '@/pages/StudentProfile';

import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Upload,
  FileSpreadsheet,
  X,
} from 'lucide-react';

/* =====================================================
   EMPTY STUDENT
===================================================== */

const emptyStudent: Omit<Student, 'id'> = {
  /* Basic information */
  name: '',
  nameAr: '',
  massarCode: '',
  dateOfBirth: '',
  classId: '',
  gender: 'Male',

  /* Educational profile */
  learningStyle: 'Not identified',
  learningPreference: 'Mixed',
  participationLevel: 'Average',
  learningBehaviour: 'Mixed',
  motivationLevel: 'Unknown',
  strengths: '',
  areasForImprovement: '',
  learningNeeds: '',
  educationalGoals: '',
  educationalNotes: '',

  /* Language */
  firstLanguage: '',
  otherLanguages: '',
  englishLevel: 'Not assessed',
  speakingLevel: 'Not assessed',
  listeningLevel: 'Not assessed',
  readingLevel: 'Not assessed',
  writingLevel: 'Not assessed',
  vocabularyLevel: 'Not assessed',
  grammarLevel: 'Not assessed',
  pronunciationLevel: 'Not assessed',

  /* Classroom behaviour */
  classroomBehaviour: 'Average',
  attentionLevel: 'Usually focused',
  homeworkCompletion: 'Usually',
  punctuality: 'Usually on time',
  peerInteraction: 'Good',
  teacherInteraction: 'Good',
  behaviourNotes: '',

  /* Attendance */
  attendancePattern: 'Unknown',
  frequentLateness: false,
  engagementLevel: 'Average',
  absenceReason: '',
  engagementNotes: '',

  /* Social / family context */
  livingArrangement: '',
  familySupport: 'Unknown',
  homeLearningEnvironment: 'Unknown',
  accessToLearningResources: 'Unknown',
  transportationDifficulty: 'Unknown',
  familyFollowUp: 'Not needed',
  socialSupport: '',
  socialEducationalNotes: '',

  /* Health / educational support */
  healthConsideration: 'None',
  healthNotes: '',
  specialEducationalNeeds: 'Not known',
  learningAccommodationNeeded: 'Not known',
  accessibilityNeeds: '',
  supportRequired: 'None',
  supportNotes: '',

  /* Interests */
  interests: '',
  hobbies: '',
  favouriteTopics: '',
  motivationFactors: '',
  careerInterests: '',
  preferredActivities: '',

  /* Teacher support plan */
  recommendedSupport: '',
  interventionNeeded: '',
  effectiveStrategies: '',
  strategiesToAvoid: '',
  shortTermGoal: '',
  followUpDate: '',
  teacherNotes: '',
};

/* =====================================================
   IMPORT TYPES
===================================================== */

interface ImportStudent {
  massarCode: string;
  nameAr: string;
  dateOfBirth: string;
}

interface HeaderIndexes {
  rowIndex: number;
  massarIndex: number;
  nameIndex: number;
  birthIndex: number;
}

/* =====================================================
   EXCEL HELPERS
===================================================== */

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .replace(/\u00A0/g, ' ')
    .replace(/\u2007/g, ' ')
    .replace(/\u202F/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\u0640/g, '')
    .trim()
    .toLowerCase();
}

function isMassarHeader(value: unknown): boolean {
  const header = normalizeHeader(value);

  return (
    header.includes('رقم التلميذ') ||
    header.includes('massar')
  );
}

function isNameHeader(value: unknown): boolean {
  const header = normalizeHeader(value);

  return (
    header.includes('إسم التلميذ') ||
    header.includes('اسم التلميذ') ||
    header.includes('student name')
  );
}

function isBirthHeader(value: unknown): boolean {
  const header = normalizeHeader(value);

  return (
    header.includes('تاريخ الإزدياد') ||
    header.includes('تاريخ الازدياد') ||
    header.includes('date of birth') ||
    header.includes('birth')
  );
}

function excelDateToString(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '';
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return '';
    }

    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, '0'),
      String(value.getDate()).padStart(2, '0'),
    ].join('-');
  }

  const raw = String(value).trim();

  if (!raw) {
    return '';
  }

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(raw)) {
    const [year, month, day] = raw.split('-');

    return [
      year,
      month.padStart(2, '0'),
      day.padStart(2, '0'),
    ].join('-');
  }

  const slashMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (slashMatch) {
    const [, day, month, year] = slashMatch;

    return `${year}-${month.padStart(
      2,
      '0'
    )}-${day.padStart(2, '0')}`;
  }

  const dashMatch = raw.match(
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/
  );

  if (dashMatch) {
    const [, day, month, year] = dashMatch;

    return `${year}-${month.padStart(
      2,
      '0'
    )}-${day.padStart(2, '0')}`;
  }

  const numeric = Number(raw);

  if (
    Number.isFinite(numeric) &&
    numeric > 20000 &&
    numeric < 60000
  ) {
    const date = XLSX.SSF.parse_date_code(numeric);

    if (date) {
      return `${date.y}-${String(date.m).padStart(
        2,
        '0'
      )}-${String(date.d).padStart(2, '0')}`;
    }
  }

  return raw;
}

function findHeaderRow(
  rows: unknown[][]
): HeaderIndexes | null {
  for (
    let rowIndex = 0;
    rowIndex < Math.min(rows.length, 30);
    rowIndex++
  ) {
    const row = rows[rowIndex] ?? [];

    let massarIndex = -1;
    let nameIndex = -1;
    let birthIndex = -1;

    row.forEach((cell, index) => {
      if (
        massarIndex === -1 &&
        isMassarHeader(cell)
      ) {
        massarIndex = index;
      }

      if (
        nameIndex === -1 &&
        isNameHeader(cell)
      ) {
        nameIndex = index;
      }

      if (
        birthIndex === -1 &&
        isBirthHeader(cell)
      ) {
        birthIndex = index;
      }
    });

    if (
      massarIndex !== -1 &&
      nameIndex !== -1
    ) {
      return {
        rowIndex,
        massarIndex,
        nameIndex,
        birthIndex,
      };
    }
  }

  return null;
}

/* =====================================================
   PAGE
===================================================== */

export function StudentsPage() {
  const {
    data,
    setData,
    deleteStudent,
  } = useData();

  /* ===================================================
     STUDENT MODAL
  =================================================== */

  const [modalOpen, setModalOpen] = useState(false);

  const [editing, setEditing] =
    useState<Student | null>(null);

  const [form, setForm] =
    useState<Student>({} as Student);

  /* ===================================================
     FILTERS
  =================================================== */

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  /* ===================================================
     PROFILE
  =================================================== */

  const [profileId, setProfileId] =
    useState<string | null>(null);

  /* ===================================================
     EXCEL IMPORT
  =================================================== */

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [importOpen, setImportOpen] =
    useState(false);

  const [importStudents, setImportStudents] =
    useState<ImportStudent[]>([]);

  const [importClassId, setImportClassId] =
    useState(data.classes?.[0]?.id ?? '');

  const [importFileName, setImportFileName] =
    useState('');

  const [importError, setImportError] =
    useState('');

  const [importing, setImporting] =
    useState(false);

  /* ===================================================
     CREATE CLASS
  =================================================== */

  const [createClassOpen, setCreateClassOpen] =
    useState(false);

  const [newClassGrade, setNewClassGrade] =
    useState('1APIC');

  const [newClassAcademicYear, setNewClassAcademicYear] =
    useState('2026/2027');

  const [newClassName, setNewClassName] =
    useState('');

  /* ===================================================
     CLASS HELPERS
  =================================================== */

  const getClassName = (classId: string) => {
    return (
      data.classes.find(
        (classRoom) => classRoom.id === classId
      )?.name ?? '—'
    );
  };

  const suggestClassId = () => {
    const ids = new Set(
      data.classes.map(
        (classRoom) => classRoom.id
      )
    );

    let number = 1;

    while (
      ids.has(
        `C${String(number).padStart(2, '0')}`
      )
    ) {
      number++;
    }

    return `C${String(number).padStart(2, '0')}`;
  };

  /* ===================================================
     FILTERED STUDENTS
  =================================================== */

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.students.filter((student) => {
      if (
        classFilter &&
        student.classId !== classFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        (student.nameAr ?? '')
          .toLowerCase()
          .includes(query) ||
        (student.massarCode ?? '')
          .toLowerCase()
          .includes(query) ||
        student.id
          .toLowerCase()
          .includes(query)
      );
    });
  }, [
    data.students,
    search,
    classFilter,
  ]);

  /* ===================================================
     ADD STUDENT
  =================================================== */

  const openAdd = () => {
    if (data.classes.length === 0) {
      alert('Please create a class first.');
      return;
    }

    setEditing(null);

    setForm({
      ...emptyStudent,
      id: nextStudentId(data.students),
      classId: data.classes[0].id,
    });

    setModalOpen(true);
  };

  /* ===================================================
     EDIT STUDENT
  =================================================== */

  const openEdit = (student: Student) => {
    setEditing(student);

    setForm({
      ...emptyStudent,
      ...student,
      nameAr: student.nameAr ?? '',
      massarCode: student.massarCode ?? '',
      dateOfBirth: student.dateOfBirth ?? '',
    });

    setModalOpen(true);
  };

  /* ===================================================
     SAVE STUDENT
  =================================================== */

  const handleSave = () => {
    const arabicName =
      form.nameAr?.trim();

    if (!arabicName || !form.classId) {
      alert(
        'Arabic Name and Class are required.'
      );
      return;
    }

    const student: Student = {
      ...form,
      name: arabicName,
      nameAr: arabicName,
      massarCode:
        form.massarCode?.trim() ?? '',
      dateOfBirth:
        form.dateOfBirth ?? '',
    };

    if (editing) {
      setData((currentData) => ({
        ...currentData,
        students:
          currentData.students.map(
            (item) =>
              item.id === editing.id
                ? student
                : item
          ),
      }));
    } else {
      const exists =
        data.students.some(
          (item) =>
            item.id === student.id
        );

      if (exists) {
        alert(
          'Student ID already exists.'
        );
        return;
      }

      setData((currentData) => ({
        ...currentData,
        students: [
          ...currentData.students,
          student,
        ],
      }));
    }

    setModalOpen(false);
    setEditing(null);
  };

  /* ===================================================
     DELETE STUDENT
  =================================================== */

  const handleDelete = (
    student: Student
  ) => {
    const displayName =
      student.nameAr ||
      student.massarCode ||
      student.id;

    const confirmed =
      window.confirm(
        `Delete student ${displayName}?\n\nThis also removes their attendance, assessments and integrated activities.`
      );

    if (!confirmed) {
      return;
    }

    deleteStudent(student.id);

    if (profileId === student.id) {
      setProfileId(null);
    }
  };

  /* ===================================================
     OPEN IMPORT
  =================================================== */

  const openImport = () => {
    if (data.classes.length === 0) {
      alert('Please create a class first.');
      return;
    }

    setImportError('');
    setImportStudents([]);
    setImportFileName('');
    setImportClassId(
      data.classes[0]?.id ?? ''
    );

    setImportOpen(true);
  };

  /* ===================================================
     READ EXCEL
  =================================================== */

  const handleExcelFile = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setImportError('');
    setImportStudents([]);
    setImportFileName(file.name);

    try {
      const buffer =
        await file.arrayBuffer();

      const workbook = XLSX.read(
        buffer,
        {
          type: 'array',
          cellDates: true,
        }
      );

      const sheetName =
        workbook.SheetNames[0];

      if (!sheetName) {
        setImportError(
          'The Excel file does not contain a worksheet.'
        );
        return;
      }

      const worksheet =
        workbook.Sheets[sheetName];

      const rows =
        XLSX.utils.sheet_to_json<
          unknown[]
        >(worksheet, {
          header: 1,
          defval: '',
          raw: true,
        });

      if (!rows.length) {
        setImportError(
          'The Excel file is empty.'
        );
        return;
      }

      const header =
        findHeaderRow(rows);

      if (!header) {
        setImportError(
          'No students could be found. Required columns: رقم التلميذ, إسم التلميذ, تاريخ الإزدياد.'
        );
        return;
      }

      const parsed: ImportStudent[] =
        [];

      for (
        let index =
          header.rowIndex + 1;
        index < rows.length;
        index++
      ) {
        const row =
          rows[index] ?? [];

        const massarCode =
          String(
            row[
              header.massarIndex
            ] ?? ''
          )
            .replace(/\u00A0/g, ' ')
            .trim();

        const nameAr =
          String(
            row[
              header.nameIndex
            ] ?? ''
          )
            .replace(/\u00A0/g, ' ')
            .trim();

        const dateOfBirth =
          header.birthIndex !== -1
            ? excelDateToString(
                row[
                  header.birthIndex
                ]
              )
            : '';

        if (!massarCode && !nameAr) {
          continue;
        }

        parsed.push({
          massarCode,
          nameAr,
          dateOfBirth,
        });
      }

      if (!parsed.length) {
        setImportError(
          'The header was found, but no student rows were found.'
        );
        return;
      }

      const seen = new Set<string>();

      const unique =
        parsed.filter((student) => {
          if (!student.massarCode) {
            return true;
          }

          const key =
            student.massarCode
              .toLowerCase();

          if (seen.has(key)) {
            return false;
          }

          seen.add(key);
          return true;
        });

      setImportStudents(unique);
    } catch (error) {
      console.error(
        'Excel import error:',
        error
      );

      setImportError(
        'Could not read this Excel file. Please make sure it is a valid .xlsx or .xls file.'
      );
    }

    event.target.value = '';
  };

  /* ===================================================
     CONFIRM IMPORT
  =================================================== */

  const confirmImport = () => {
    if (!importClassId) {
      alert(
        'Please select a class first.'
      );
      return;
    }

    if (!importStudents.length) {
      alert(
        'There are no students to import.'
      );
      return;
    }

    setImporting(true);

    try {
      let importedCount = 0;
      let skippedDuplicates = 0;

      setData((currentData) => {
        const students =
          currentData.students ?? [];

        const massarCodes =
          new Set(
            students
              .map((student) =>
                (
                  student.massarCode ??
                  ''
                )
                  .trim()
                  .toLowerCase()
              )
              .filter(Boolean)
          );

        const classNames =
          new Set(
            students
              .filter(
                (student) =>
                  student.classId ===
                  importClassId
              )
              .map((student) =>
                (
                  student.nameAr ??
                  student.name
                )
                  .trim()
                  .toLowerCase()
              )
              .filter(Boolean)
          );

        const newStudents: Student[] =
          [];

        for (const imported of importStudents) {
          const massarKey =
            imported.massarCode
              .trim()
              .toLowerCase();

          const nameKey =
            imported.nameAr
              .trim()
              .toLowerCase();

          if (
            massarKey &&
            massarCodes.has(
              massarKey
            )
          ) {
            skippedDuplicates++;
            continue;
          }

          if (
            nameKey &&
            classNames.has(nameKey)
          ) {
            skippedDuplicates++;
            continue;
          }

          const id =
            nextStudentId([
              ...students,
              ...newStudents,
            ]);

          const student: Student = {
            ...emptyStudent,
            id,
            name:
              imported.nameAr,
            nameAr:
              imported.nameAr,
            massarCode:
              imported.massarCode,
            dateOfBirth:
              imported.dateOfBirth,
            classId:
              importClassId,
            gender: 'Male',
          };

          newStudents.push(student);
          importedCount++;

          if (massarKey) {
            massarCodes.add(
              massarKey
            );
          }

          if (nameKey) {
            classNames.add(
              nameKey
            );
          }
        }

        return {
          ...currentData,
          students: [
            ...students,
            ...newStudents,
          ],
        };
      });

      alert(
        `${importedCount} student(s) imported successfully.${
          skippedDuplicates > 0
            ? ` ${skippedDuplicates} duplicate(s) skipped.`
            : ''
        }`
      );

      setImportOpen(false);
      setImportStudents([]);
      setImportFileName('');
    } catch (error) {
      console.error(
        'Import students error:',
        error
      );

      alert(
        'Something went wrong while importing students.'
      );
    } finally {
      setImporting(false);
    }
  };

  /* ===================================================
     CREATE CLASS
  =================================================== */

  const openCreateClass = () => {
    setNewClassGrade('1APIC');
    setNewClassAcademicYear(
      '2026/2027'
    );
    setNewClassName('');
    setCreateClassOpen(true);
  };

  const createClassFromImport = () => {
    const grade =
      newClassGrade.trim();

    const academicYear =
      newClassAcademicYear.trim();

    const className =
      newClassName.trim();

    if (
      !grade ||
      !academicYear ||
      !className
    ) {
      alert(
        'Level, Academic Year and Class Name are required.'
      );
      return;
    }

    const duplicate =
      data.classes.some(
        (item) =>
          item.name
            .trim()
            .toLowerCase() ===
            className.toLowerCase() &&
          item.grade === grade &&
          item.academicYear ===
            academicYear
      );

    if (duplicate) {
      alert(
        'A class with this name already exists for this level and academic year.'
      );
      return;
    }

    const newClass: ClassRoom = {
      id: suggestClassId(),
      name: className,
      grade,
      academicYear,
    };

    setData((currentData) => ({
      ...currentData,
      classes: [
        ...currentData.classes,
        newClass,
      ],
    }));

    setImportClassId(
      newClass.id
    );

    setCreateClassOpen(false);
  };

  /* ===================================================
     PROFILE
  =================================================== */

  if (profileId) {
    return (
      <StudentProfile
        studentId={profileId}
        onBack={() =>
          setProfileId(null)
        }
      />
    );
  }

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <div>
      {/* HEADER */}

      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">
          Students
        </h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openImport}
            disabled={
              !data.classes.length
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <Upload size={16} />
            Import Excel
          </button>

          <button
            type="button"
            onClick={openAdd}
            disabled={
              !data.classes.length
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus size={16} />
            Add Student
          </button>
        </div>
      </div>

      {/* NO CLASSES */}

      {!data.classes.length && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Add a class first before
          importing or adding students.
        </p>
      )}

      {/* SEARCH */}

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search by Massar Code or Arabic name..."
            className="form-input pl-9"
          />
        </div>

        <select
          value={classFilter}
          onChange={(event) =>
            setClassFilter(
              event.target.value
            )
          }
          className="form-select min-w-[180px]"
        >
          <option value="">
            All Classes
          </option>

          {data.classes.map(
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
      </div>

      {/* TABLE */}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">
                Massar Code
              </th>

              <th
                className="px-4 py-3 font-semibold"
                dir="rtl"
              >
                الاسم بالعربية
              </th>

              <th className="px-4 py-3 font-semibold">
                Date of Birth
              </th>

              <th className="px-4 py-3 font-semibold">
                Class
              </th>

              <th className="px-4 py-3 font-semibold">
                Gender
              </th>

              <th className="px-4 py-3 font-semibold">
                Attendance
              </th>

              <th className="px-4 py-3 font-semibold">
                Avg Score
              </th>

              <th className="px-4 py-3 font-semibold">
                Status
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {!filteredStudents.length && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No students found.
                </td>
              </tr>
            )}

            {filteredStudents.map(
              (student) => {
                const summary =
                  summarizeStudent(
                    student,
                    data.attendance,
                    data.assessments
                  );

                return (
                  <tr
                    key={student.id}
                    onClick={() =>
                      setProfileId(
                        student.id
                      )
                    }
                    className="cursor-pointer hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {student.massarCode ||
                        '—'}
                    </td>

                    <td
                      className="px-4 py-3 text-right font-medium text-slate-700"
                      dir="rtl"
                      lang="ar"
                    >
                      {student.nameAr ||
                        '—'}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(
                        student.dateOfBirth
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {getClassName(
                        student.classId
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {student.gender}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {summary.totalSessions >
                      0
                        ? fmtPct(
                            summary.attendanceRate
                          )
                        : '-'}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {fmtPct(
                        summary.averageScore
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge
                        status={
                          summary.status
                        }
                      />
                    </td>

                    <td
                      className="px-4 py-3"
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            openEdit(
                              student
                            )
                          }
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-sky-600"
                          aria-label="Edit student"
                        >
                          <Pencil
                            size={16}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              student
                            )
                          }
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                          aria-label="Delete student"
                        >
                          <Trash2
                            size={16}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      <Modal
        open={modalOpen}
        title={
          editing
            ? 'Edit Student'
            : 'Add Student'
        }
        onClose={() =>
          setModalOpen(false)
        }
      >
        <div className="space-y-6">
          {/* BASIC INFORMATION */}

          <FormSection title="Basic Information">
            <Field label="Massar Code">
              <input
                value={
                  form.massarCode ?? ''
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    massarCode:
                      event.target.value,
                  })
                }
                className="form-input"
              />
            </Field>

            <Field label="Student ID">
              <input
                value={form.id}
                disabled
                className="form-input bg-slate-50"
              />
            </Field>

            <Field label="الاسم بالعربية">
              <input
                value={
                  form.nameAr ?? ''
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    name:
                      event.target.value,
                    nameAr:
                      event.target.value,
                  })
                }
                placeholder="مثال: حراك آدم"
                dir="rtl"
                lang="ar"
                className="form-input text-right"
              />
            </Field>

            <Field label="Date of Birth">
              <input
                type="date"
                value={
                  form.dateOfBirth ?? ''
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    dateOfBirth:
                      event.target.value,
                  })
                }
                className="form-input"
              />
            </Field>

            <Field label="Class">
              <select
                value={
                  form.classId
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    classId:
                      event.target.value,
                  })
                }
                className="form-select"
              >
                <option value="">
                  Select class...
                </option>

                {data.classes.map(
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
            </Field>

            <Field label="Gender">
              <select
                value={form.gender}
                onChange={(event) =>
                  setForm({
                    ...form,
                    gender:
                      event.target
                        .value as Gender,
                  })
                }
                className="form-select"
              >
                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>
              </select>
            </Field>
          </FormSection>

          {/* EDUCATIONAL PROFILE */}

          <FormSection title="Educational Profile">
            <SelectField
              label="Learning Style"
              value={
                form.learningStyle ??
                'Not identified'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  learningStyle:
                    value as LearningStyle,
                })
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
              label="Learning Preference"
              value={
                form.learningPreference ??
                'Mixed'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  learningPreference:
                    value as LearningPreference,
                })
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
                form.participationLevel ??
                'Average'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  participationLevel:
                    value as ParticipationLevel,
                })
              }
              options={[
                'Active',
                'Average',
                'Quiet',
                'Needs encouragement',
              ]}
            />

            <SelectField
              label="Learning Behaviour"
              value={
                form.learningBehaviour ??
                'Mixed'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  learningBehaviour:
                    value as LearningBehaviour,
                })
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
                form.motivationLevel ??
                'Unknown'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  motivationLevel:
                    value as MotivationLevel,
                })
              }
              options={[
                'High',
                'Good',
                'Average',
                'Low',
                'Unknown',
              ]}
            />

            <TextAreaField
              label="Learning Needs"
              value={
                form.learningNeeds ??
                ''
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  learningNeeds:
                    value,
                })
              }
              placeholder="What does the student need help with?"
            />
          </FormSection>

          {/* LANGUAGE */}

          <FormSection title="Language & Learning">
            <TextField
              label="First Language"
              value={
                form.firstLanguage ??
                ''
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  firstLanguage:
                    value,
                })
              }
            />

            <TextField
              label="Other Languages"
              value={
                form.otherLanguages ??
                ''
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  otherLanguages:
                    value,
                })
              }
            />

            <SkillSelect
              label="English Level"
              value={
                form.englishLevel ??
                'Not assessed'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  englishLevel:
                    value,
                })
              }
            />

            <SkillSelect
              label="Speaking Level"
              value={
                form.speakingLevel ??
                'Not assessed'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  speakingLevel:
                    value,
                })
              }
            />

            <SkillSelect
              label="Listening Level"
              value={
                form.listeningLevel ??
                'Not assessed'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  listeningLevel:
                    value,
                })
              }
            />

            <SkillSelect
              label="Reading Level"
              value={
                form.readingLevel ??
                'Not assessed'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  readingLevel:
                    value,
                })
              }
            />

            <SkillSelect
              label="Writing Level"
              value={
                form.writingLevel ??
                'Not assessed'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  writingLevel:
                    value,
                })
              }
            />

            <SkillSelect
              label="Vocabulary Level"
              value={
                form.vocabularyLevel ??
                'Not assessed'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  vocabularyLevel:
                    value,
                })
              }
            />

            <SkillSelect
              label="Grammar Level"
              value={
                form.grammarLevel ??
                'Not assessed'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  grammarLevel:
                    value,
                })
              }
            />

            <SkillSelect
              label="Pronunciation Level"
              value={
                form.pronunciationLevel ??
                'Not assessed'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  pronunciationLevel:
                    value,
                })
              }
            />
          </FormSection>

          {/* CLASSROOM BEHAVIOUR */}

          <FormSection title="Classroom Behaviour">
            <SelectField
              label="Classroom Behaviour"
              value={
                form.classroomBehaviour ??
                'Average'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  classroomBehaviour:
                    value as Student['classroomBehaviour'],
                })
              }
              options={[
                'Excellent',
                'Good',
                'Average',
                'Needs improvement',
              ]}
            />

            <SelectField
              label="Attention Level"
              value={
                form.attentionLevel ??
                'Usually focused'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  attentionLevel:
                    value as Student['attentionLevel'],
                })
              }
              options={[
                'Focused',
                'Usually focused',
                'Sometimes distracted',
                'Frequently distracted',
              ]}
            />

            <SelectField
              label="Homework Completion"
              value={
                form.homeworkCompletion ??
                'Usually'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  homeworkCompletion:
                    value as Student['homeworkCompletion'],
                })
              }
              options={[
                'Always',
                'Usually',
                'Sometimes',
                'Rarely',
              ]}
            />

            <SelectField
              label="Punctuality"
              value={
                form.punctuality ??
                'Usually on time'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  punctuality:
                    value as Student['punctuality'],
                })
              }
              options={[
                'Always on time',
                'Usually on time',
                'Sometimes late',
                'Frequently late',
              ]}
            />

            <SelectField
              label="Peer Interaction"
              value={
                form.peerInteraction ??
                'Good'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  peerInteraction:
                    value as Student['peerInteraction'],
                })
              }
              options={[
                'Excellent',
                'Good',
                'Average',
                'Needs support',
              ]}
            />

            <SelectField
              label="Teacher Interaction"
              value={
                form.teacherInteraction ??
                'Good'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  teacherInteraction:
                    value as Student['teacherInteraction'],
                })
              }
              options={[
                'Excellent',
                'Good',
                'Average',
                'Needs encouragement',
              ]}
            />

            <TextAreaField
              label="Behaviour Notes"
              value={
                form.behaviourNotes ??
                ''
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  behaviourNotes:
                    value,
                })
              }
            />
          </FormSection>

          {/* TEACHER NOTES */}

          <FormSection title="Teacher Notes">
            <TextAreaField
              label="Strengths"
              value={
                form.strengths ?? ''
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  strengths: value,
                })
              }
              placeholder="What does the student do well?"
            />

            <TextAreaField
              label="Areas for Improvement"
              value={
                form.areasForImprovement ??
                ''
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  areasForImprovement:
                    value,
                })
              }
            />

            <TextAreaField
              label="Educational Goals"
              value={
                form.educationalGoals ??
                ''
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  educationalGoals:
                    value,
                })
              }
            />

            <TextAreaField
              label="Educational Notes"
              value={
                form.educationalNotes ??
                ''
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  educationalNotes:
                    value,
                })
              }
            />
          </FormSection>

          {/* SAVE BUTTONS */}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() =>
                setModalOpen(false)
              }
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
            >
              {editing
                ? 'Save Changes'
                : 'Add Student'}
            </button>
          </div>
        </div>
      </Modal>

      {/* =================================================
          IMPORT MODAL
      ================================================= */}

      <Modal
        open={importOpen}
        title="Import Students from Excel"
        onClose={() => {
          if (!importing) {
            setImportOpen(false);
          }
        }}
      >
        <div className="space-y-5">
          <div className="rounded-lg border border-sky-100 bg-sky-50 p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet
                size={20}
                className="mt-0.5 text-sky-600"
              />

              <div>
                <p className="text-sm font-semibold text-sky-800">
                  Ministry Excel format
                </p>

                <p
                  className="mt-1 text-xs leading-5 text-sky-700"
                  dir="rtl"
                >
                  خاص الملف يحتوي على الأعمدة:
                  <br />

                  <strong>
                    رقم التلميذ
                  </strong>

                  {' ، '}

                  <strong>
                    إسم التلميذ
                  </strong>

                  {' ، '}

                  <strong>
                    تاريخ الإزدياد
                  </strong>
                </p>
              </div>
            </div>
          </div>

          <Field label="Import students into">
            <div className="flex gap-2">
              <select
                value={
                  importClassId
                }
                onChange={(event) =>
                  setImportClassId(
                    event.target.value
                  )
                }
                className="form-select flex-1"
              >
                <option value="">
                  Select class...
                </option>

                {data.classes.map(
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

              <button
                type="button"
                onClick={
                  openCreateClass
                }
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-sky-300 bg-white px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-50"
              >
                <Plus size={16} />
                Create Class
              </button>
            </div>
          </Field>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={
                handleExcelFile
              }
              className="hidden"
            />

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm font-medium text-slate-600 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
            >
              <Upload size={20} />

              {importFileName ||
                'Choose Excel File'}
            </button>
          </div>

          {importError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {importError}
            </div>
          )}

          {importStudents.length >
            0 && (
            <div>
              <div className="mb-2">
                <p className="text-sm font-semibold text-slate-800">
                  Preview
                </p>

                <p className="text-xs text-slate-500">
                  {
                    importStudents.length
                  }{' '}
                  student(s) found
                </p>
              </div>

              <div className="max-h-80 overflow-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                        #
                      </th>

                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                        Massar Code
                      </th>

                      <th
                        className="px-3 py-2 text-right text-xs font-semibold text-slate-500"
                        dir="rtl"
                      >
                        الاسم بالعربية
                      </th>

                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                        Date of Birth
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {importStudents.map(
                      (
                        student,
                        index
                      ) => (
                        <tr
                          key={`${student.massarCode}-${index}`}
                        >
                          <td className="px-3 py-2 text-slate-400">
                            {index + 1}
                          </td>

                          <td className="px-3 py-2 font-medium text-slate-700">
                            {student.massarCode ||
                              '—'}
                          </td>

                          <td
                            className="px-3 py-2 text-right font-medium text-slate-700"
                            dir="rtl"
                            lang="ar"
                          >
                            {student.nameAr ||
                              '—'}
                          </td>

                          <td className="px-3 py-2 text-slate-600">
                            {formatDate(
                              student.dateOfBirth
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={importing}
              onClick={() =>
                setImportOpen(false)
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <X size={16} />
              Cancel
            </button>

            <button
              type="button"
              disabled={
                importing ||
                !importStudents.length ||
                !importClassId
              }
              onClick={
                confirmImport
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Upload size={16} />

              {importing
                ? 'Importing...'
                : `Import ${importStudents.length} Students`}
            </button>
          </div>
        </div>
      </Modal>

      {/* =================================================
          CREATE CLASS MODAL
      ================================================= */}

      <Modal
        open={createClassOpen}
        title="Create New Class"
        onClose={() =>
          setCreateClassOpen(false)
        }
      >
        <div className="space-y-4">
          <Field label="Level">
            <select
              value={
                newClassGrade
              }
              onChange={(event) =>
                setNewClassGrade(
                  event.target.value
                )
              }
              className="form-select"
            >
              <option value="1APIC">
                1APIC
              </option>

              <option value="2APIC">
                2APIC
              </option>

              <option value="3APIC">
                3APIC
              </option>
            </select>
          </Field>

          <Field label="Academic Year">
            <input
              value={
                newClassAcademicYear
              }
              onChange={(event) =>
                setNewClassAcademicYear(
                  event.target.value
                )
              }
              placeholder="2026/2027"
              className="form-input"
            />
          </Field>

          <Field label="Class Name">
            <input
              value={
                newClassName
              }
              onChange={(event) =>
                setNewClassName(
                  event.target.value
                )
              }
              placeholder="Example: 11"
              className="form-input"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() =>
                setCreateClassOpen(
                  false
                )
              }
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={
                createClassFromImport
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
            >
              <Plus size={16} />
              Create Class
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* =====================================================
   FORM SECTION
===================================================== */

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">
        {title}
      </h3>

      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

/* =====================================================
   TEXT FIELD
===================================================== */

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="form-input"
      />
    </Field>
  );
}

/* =====================================================
   TEXT AREA
===================================================== */

function TextAreaField({
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
    <Field label={label}>
      <textarea
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        rows={3}
        className="form-input resize-none"
      />
    </Field>
  );
}

/* =====================================================
   SELECT FIELD
===================================================== */

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="form-select"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </Field>
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
  value: SkillLevel;
  onChange: (value: SkillLevel) => void;
}) {
  return (
    <SelectField
      label={label}
      value={value}
      onChange={(value) =>
        onChange(
          value as SkillLevel
        )
      }
      options={[
        'Strong',
        'Good',
        'Developing',
        'Needs Support',
        'Not assessed',
      ]}
    />
  );
}

/* =====================================================
   DATE FORMAT
===================================================== */

function formatDate(
  value?: string
): string {
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