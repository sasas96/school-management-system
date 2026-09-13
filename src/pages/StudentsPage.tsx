import { useMemo, useRef, useState } from 'react';
import {
  Plus,
  Search,
  Users,
  X,
  Save,
  Edit,
  Trash2,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { useData } from '@/store/DataContext';

import type {
  Student,
  LearningStyle,
  LearningPreference,
  ParticipationLevel,
  LearningBehaviour,
  MotivationLevel,
  SkillLevel,
  FamilySupport,
  HomeLearningEnvironment,
  ResourceAccess,
  DifficultyLevel,
  AttendancePattern,
  AccommodationStatus,
  ClassroomBehaviour,
  AttentionLevel,
  HomeworkCompletion,
  PunctualityLevel,
  PeerInteraction,
  TeacherInteraction,
  FamilyFollowUp,
  SupportRequired,
  HealthConsideration,
} from '@/types';

/* =====================================================
   DEFAULT STUDENT
===================================================== */

const emptyStudent = (): Partial<Student> => ({
  massarCode: '',
  name: '',
  nameAr: '',
  dateOfBirth: '',
  classId: '',

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

  firstLanguage: 'Arabic',
  otherLanguages: '',

  englishLevel: 'Not assessed',
  speakingLevel: 'Not assessed',
  listeningLevel: 'Not assessed',
  readingLevel: 'Not assessed',
  writingLevel: 'Not assessed',
  vocabularyLevel: 'Not assessed',
  grammarLevel: 'Not assessed',
  pronunciationLevel: 'Not assessed',

  classroomBehaviour: 'Good',
  attentionLevel: 'Usually focused',
  homeworkCompletion: 'Usually',
  punctuality: 'Usually on time',
  peerInteraction: 'Good',
  teacherInteraction: 'Good',
  behaviourNotes: '',

  attendancePattern: 'Unknown',
  frequentLateness: false,
  engagementLevel: 'Average',
  absenceReason: '',
  engagementNotes: '',

  livingArrangement: '',
  familySupport: 'Unknown',
  homeLearningEnvironment: 'Unknown',
  accessToLearningResources: 'Unknown',
  transportationDifficulty: 'No issue',
  familyFollowUp: 'Not needed',
  socialSupport: '',
  socialEducationalNotes: '',

  healthConsideration: 'None',
  healthNotes: '',
  specialEducationalNeeds: 'Not known',
  learningAccommodationNeeded: 'Not known',
  accessibilityNeeds: '',
  supportRequired: 'None',
  supportNotes: '',

  interests: '',
  hobbies: '',
  favouriteTopics: '',
  motivationFactors: '',
  careerInterests: '',
  preferredActivities: '',

  recommendedSupport: '',
  interventionNeeded: '',
  effectiveStrategies: '',
  strategiesToAvoid: '',
  shortTermGoal: '',
  followUpDate: '',
  teacherNotes: '',
});

/* =====================================================
   IMPORT TYPES
===================================================== */

interface ImportedStudent {
  massarCode: string;
  nameAr: string;
  dateOfBirth: string;
}

/* =====================================================
   TEXT HELPERS
===================================================== */

function cleanCell(value: unknown): string {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  return String(value).trim();
}

/* =====================================================
   REPAIR MOJIBAKE
===================================================== */

function repairMojibake(value: string): string {
  if (!value) {
    return '';
  }

  const suspicious =
    /[ÃÂÐÑØÙÚÛÜÝÞßÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞ]/;

  if (!suspicious.test(value)) {
    return value;
  }

  try {
    const bytes = new Uint8Array(
      Array.from(value).map(
        (char) =>
          char.charCodeAt(0) & 0xff
      )
    );

    const decoded = new TextDecoder(
      'utf-8'
    ).decode(bytes);

    if (
      decoded &&
      !decoded.includes('\ufffd') &&
      /[\u0600-\u06ff]/.test(decoded)
    ) {
      return decoded;
    }
  } catch {
    // Keep original value.
  }

  return value;
}

/* =====================================================
   HEADER NORMALIZATION
===================================================== */

function normalizeHeader(value: unknown): string {
  return repairMojibake(
    cleanCell(value)
  )
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* =====================================================
   HEADER MATCH
===================================================== */

function headerMatches(
  value: unknown,
  possibleNames: string[]
): boolean {
  const normalized = normalizeHeader(value);

  if (!normalized) {
    return false;
  }

  return possibleNames.some(
    (name) =>
      normalized === normalizeHeader(name)
  );
}

/* =====================================================
   FIND STUDENT HEADER ROW
===================================================== */

function findStudentHeaderRow(
  worksheet: XLSX.WorkSheet
): {
  rowIndex: number;
  massarColumn: number;
  nameColumn: number;
  dobColumn: number;
} | null {
  const range = XLSX.utils.decode_range(
    worksheet['!ref'] || 'A1:A1'
  );

  const maxRows = Math.min(
    range.e.r,
    30
  );

  const massarHeaders = [
    'رقم التلميذ',
    'رقم التلميذة',
    'رقم التلميذ(ة)',
    'رقم مسار',
    'رمز مسار',
    'Massar Code',
    'Massar',
    'Code Massar',
    'Code',
  ];

  const nameHeaders = [
    'إسم التلميذ',
    'اسم التلميذ',
    'إسم التلميذة',
    'اسم التلميذة',
    'إسم التلميذ(ة)',
    'اسم التلميذ(ة)',
    'الاسم بالعربية',
    'الاسم العربي',
    'Arabic Name',
    'Name Arabic',
    'Student Arabic Name',
  ];

  const dobHeaders = [
    'تاريخ الإزدياد',
    'تاريخ الازدياد',
    'تاريخ الميلاد',
    'Date of Birth',
    'Birth Date',
    'DOB',
    'Date naissance',
  ];

  for (
    let rowIndex = range.s.r;
    rowIndex <= maxRows;
    rowIndex++
  ) {
    let massarColumn = -1;
    let nameColumn = -1;
    let dobColumn = -1;

    for (
      let columnIndex = range.s.c;
      columnIndex <= range.e.c;
      columnIndex++
    ) {
      const address =
        XLSX.utils.encode_cell({
          r: rowIndex,
          c: columnIndex,
        });

      const value =
        worksheet[address]?.v;

      if (
        headerMatches(
          value,
          massarHeaders
        )
      ) {
        massarColumn = columnIndex;
      }

      if (
        headerMatches(
          value,
          nameHeaders
        )
      ) {
        nameColumn = columnIndex;
      }

      if (
        headerMatches(
          value,
          dobHeaders
        )
      ) {
        dobColumn = columnIndex;
      }
    }

    if (
      massarColumn !== -1 &&
      nameColumn !== -1
    ) {
      return {
        rowIndex,
        massarColumn,
        nameColumn,
        dobColumn,
      };
    }
  }

  return null;
}

/* =====================================================
   EXCEL DATE → ISO
===================================================== */

function excelDateToISO(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '';
  }

  if (value instanceof Date) {
    const year = value.getFullYear();

    const month = String(
      value.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      value.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  if (typeof value === 'number') {
    try {
      const date =
        XLSX.SSF.parse_date_code(
          value
        );

      if (date) {
        const year = String(
          date.y
        ).padStart(4, '0');

        const month = String(
          date.m
        ).padStart(2, '0');

        const day = String(
          date.d
        ).padStart(2, '0');

        return `${year}-${month}-${day}`;
      }
    } catch {
      // Continue.
    }
  }

  const text = cleanCell(value);

  if (!text) {
    return '';
  }

  const isoMatch = text.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/
  );

  if (isoMatch) {
    const [
      ,
      year,
      month,
      day,
    ] = isoMatch;

    return `${year}-${month.padStart(
      2,
      '0'
    )}-${day.padStart(2, '0')}`;
  }

  const dashMatch = text.match(
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/
  );

  if (dashMatch) {
    const [
      ,
      day,
      month,
      year,
    ] = dashMatch;

    return `${year}-${month.padStart(
      2,
      '0'
    )}-${day.padStart(2, '0')}`;
  }

  const slashMatch = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (slashMatch) {
    const [
      ,
      day,
      month,
      year,
    ] = slashMatch;

    return `${year}-${month.padStart(
      2,
      '0'
    )}-${day.padStart(2, '0')}`;
  }

  return text;
}

/* =====================================================
   GET CELL
===================================================== */

function getCellValue(
  worksheet: XLSX.WorkSheet,
  row: number,
  column: number
): unknown {
  const address =
    XLSX.utils.encode_cell({
      r: row,
      c: column,
    });

  return worksheet[address]?.v;
}

/* =====================================================
   COMPONENT
===================================================== */

export function StudentsPage() {
  const {
    data,
    addStudent,
    updateStudent,
    deleteStudent,
  } = useData();

  const classes =
    data.classes ?? [];

  const students =
    data.students ?? [];

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    selectedClass,
    setSelectedClass,
  ] = useState('');

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editingStudent,
    setEditingStudent,
  ] = useState<Student | null>(
    null
  );

  const [
    form,
    setForm,
  ] = useState<Partial<Student>>(
    emptyStudent()
  );

  /* =====================================================
     IMPORT STATE
  ===================================================== */

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    importOpen,
    setImportOpen,
  ] = useState(false);

  const [
    importing,
    setImporting,
  ] = useState(false);

  const [
    importFileName,
    setImportFileName,
  ] = useState('');

  const [
    importError,
    setImportError,
  ] = useState('');

  const [
    importStudents,
    setImportStudents,
  ] = useState<
    ImportedStudent[]
  >([]);

  const [
    importClassId,
    setImportClassId,
  ] = useState('');

  /* =====================================================
     BULK SELECTION
  ===================================================== */

  const [
    selectedStudentIds,
    setSelectedStudentIds,
  ] = useState<Set<string>>(
    () => new Set()
  );

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredStudents =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return students.filter(
        (student) => {
          const matchesSearch =
            !query ||
            student.name
              ?.toLowerCase()
              .includes(query) ||
            student.nameAr
              ?.toLowerCase()
              .includes(query) ||
            student.massarCode
              ?.toLowerCase()
              .includes(query);

          const matchesClass =
            !selectedClass ||
            student.classId ===
              selectedClass;

          return (
            matchesSearch &&
            matchesClass
          );
        }
      );
    }, [
      students,
      search,
      selectedClass,
    ]);

  /* =====================================================
     ADD
  ===================================================== */

  const openAdd = () => {
    setEditingStudent(null);

    const defaultClass =
      selectedClass ||
      classes[0]?.id ||
      '';

    setForm({
      ...emptyStudent(),
      classId: defaultClass,
    });

    setShowModal(true);
  };

  /* =====================================================
     EDIT
  ===================================================== */

  const openEdit = (
    student: Student
  ) => {
    setEditingStudent(student);

    setForm({
      ...student,
    });

    setShowModal(true);
  };

  /* =====================================================
     CLOSE
  ===================================================== */

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setForm(
      emptyStudent()
    );
  };

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  const handleChange = (
    field: keyof Student,
    value: unknown
  ) => {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  };

  /* =====================================================
     SAVE STUDENT
  ===================================================== */

  const handleSave = async () => {
    if (!form.nameAr?.trim()) {
      alert('Please enter the Arabic student name.');
      return;
    }

    if (!form.classId) {
      alert('Please select a class.');
      return;
    }
const studentData: Student = {
      ...(form as Student),
      id:
        editingStudent?.id ||
        form.massarCode?.trim() ||
        `STU-${Date.now()}`,
      name: form.name?.trim() || form.nameAr.trim(),
      nameAr: form.nameAr.trim(),
      massarCode: form.massarCode?.trim() || '',
      classId: form.classId,
};

    try {
      if (editingStudent) {
        await updateStudent(studentData);
      } else {
        await addStudent(studentData);
      }

      closeModal();
    } catch (error) {
      console.error('SAVE STUDENT ERROR:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to save student.'
      );
    }
  };

  /* =====================================================
     BULK SELECTION
  ===================================================== */

  const toggleStudentSelection = (
    studentId: string
  ) => {
    setSelectedStudentIds((current) => {
      const next = new Set(current);

      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }

      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedStudentIds((current) => {
      const next = new Set(current);

      const allVisibleSelected =
        filteredStudents.length > 0 &&
        filteredStudents.every((student) =>
          next.has(student.id)
        );

      if (allVisibleSelected) {
        filteredStudents.forEach((student) =>
          next.delete(student.id)
        );
      } else {
        filteredStudents.forEach((student) =>
          next.add(student.id)
        );
      }

      return next;
    });
  };

  const handleDeleteSelected = async () => {
    const selected = students.filter((student) =>
      selectedStudentIds.has(student.id)
    );

    if (!selected.length) return;

    const confirmed = window.confirm(
      `Delete ${selected.length} selected student(s)?\n\nThis will also delete their attendance, assessment and activity records. This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      for (const student of selected) {
        await deleteStudent(student.id);
      }

      setSelectedStudentIds(new Set());
    } catch (error) {
      console.error(
        'BULK DELETE STUDENTS ERROR:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to delete selected students.'
      );
    }
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete = (
    student: Student
  ) => {
    const confirmed =
      window.confirm(
        `Delete ${
          student.nameAr ||
          student.name
        }?`
      );

    if (!confirmed) {
      return;
    }

    deleteStudent(
      student.id
    );
  };

  /* =====================================================
     CLASS NAME
  ===================================================== */

  const getClassName = (
    classId: string
  ) => {
    return (
      classes.find(
        (item) =>
          item.id === classId
      )?.name ||
      'No class'
    );
  };

  /* =====================================================
     OPEN IMPORT
  ===================================================== */

  const openImport = () => {
    setImportOpen(true);
    setImportError('');
    setImportStudents([]);
    setImportFileName('');

    setImportClassId(
      selectedClass ||
        classes[0]?.id ||
        ''
    );
  };

  /* =====================================================
     CLOSE IMPORT
  ===================================================== */

  const closeImport = () => {
    if (importing) {
      return;
    }

    setImportOpen(false);
    setImportError('');
    setImportStudents([]);
    setImportFileName('');

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        '';
    }
  };

  /* =====================================================
     HANDLE EXCEL
  ===================================================== */

  const handleExcelFile =
    async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setImportError('');
      setImportStudents([]);
      setImportFileName(
        file.name
      );

      try {
        const buffer =
          await file.arrayBuffer();

        const workbook =
          XLSX.read(
            buffer,
            {
              type: 'array',
              cellDates: true,
            }
          );

        if (
          !workbook
            .SheetNames.length
        ) {
          throw new Error(
            'The Excel file does not contain any worksheet.'
          );
        }

        const sheetName =
          workbook
            .SheetNames[0];

        const worksheet =
          workbook.Sheets[
            sheetName
          ];

        if (!worksheet) {
          throw new Error(
            'Could not read the first worksheet.'
          );
        }

        const header =
          findStudentHeaderRow(
            worksheet
          );

        if (!header) {
          throw new Error(
            'Could not detect the student header row. Make sure the Excel file contains "رقم التلميذ" and "إسم التلميذ".'
          );
        }

        console.log(
          'Detected Excel header:',
          header
        );

        const range =
          XLSX.utils.decode_range(
            worksheet['!ref'] ||
              'A1:A1'
          );

        const parsed:
          ImportedStudent[] =
          [];

        for (
          let rowIndex =
            header.rowIndex + 1;
          rowIndex <=
            range.e.r;
          rowIndex++
        ) {
          const rawMassar =
            getCellValue(
              worksheet,
              rowIndex,
              header.massarColumn
            );

          const rawName =
            getCellValue(
              worksheet,
              rowIndex,
              header.nameColumn
            );

          const rawDob =
            header.dobColumn !==
            -1
              ? getCellValue(
                  worksheet,
                  rowIndex,
                  header.dobColumn
                )
              : '';

          const massarCode =
            repairMojibake(
              cleanCell(
                rawMassar
              )
            ).trim();

          const nameAr =
            repairMojibake(
              cleanCell(
                rawName
              )
            ).trim();

          const dateOfBirth =
            excelDateToISO(
              rawDob
            );

          if (
            !massarCode &&
            !nameAr
          ) {
            continue;
          }

          if (!nameAr) {
            continue;
          }

          parsed.push({
            massarCode,
            nameAr,
            dateOfBirth,
          });
        }

        if (!parsed.length) {
          throw new Error(
            'No students could be found after the detected header row.'
          );
        }

        const uniqueStudents:
          ImportedStudent[] =
          [];

        const seenMassar =
          new Set<string>();

        for (
          const student of parsed
        ) {
          const normalized =
            student.massarCode
              .trim()
              .toLowerCase();

          if (
            normalized &&
            seenMassar.has(
              normalized
            )
          ) {
            continue;
          }

          if (normalized) {
            seenMassar.add(
              normalized
            );
          }

          uniqueStudents.push(
            student
          );
        }

        setImportStudents(
          uniqueStudents
        );

        console.log(
          `Excel preview: ${uniqueStudents.length} students`
        );
      } catch (error) {
        console.error(
          'Excel import error:',
          error
        );

        setImportStudents([]);

        setImportError(
          error instanceof Error
            ? error.message
            : 'Could not read the Excel file.'
        );
      }
    };

  /* =====================================================
     CONFIRM IMPORT
  ===================================================== */

  const confirmImport =
    async () => {
      if (!importClassId) {
        setImportError(
          'Please select a class.'
        );
        return;
      }

      if (
        !importStudents.length
      ) {
        setImportError(
          'There are no students to import.'
        );
        return;
      }

      setImporting(true);
      setImportError('');

      try {
        const existingMassarCodes =
          new Set(
            students
              .map(
                (student) =>
                  student.massarCode
                    ?.trim()
                    .toLowerCase()
              )
              .filter(
                Boolean
              )
          );

        const importedMassarCodes =
          new Set<string>();

        let added = 0;
        let skipped = 0;

        for (
          let index = 0;
          index <
          importStudents.length;
          index++
        ) {
          const imported =
            importStudents[
              index
            ];

          const massar =
            imported.massarCode.trim();

          const nameAr =
            imported.nameAr.trim();

          if (!nameAr) {
            skipped++;
            continue;
          }

          const normalizedMassar =
            massar.toLowerCase();

          if (
            normalizedMassar &&
            existingMassarCodes.has(
              normalizedMassar
            )
          ) {
            skipped++;
            continue;
          }

          if (
            normalizedMassar &&
            importedMassarCodes.has(
              normalizedMassar
            )
          ) {
            skipped++;
            continue;
          }

          const student = {
            ...emptyStudent(),

            id:
              massar || `STU-${Date.now()}-${index}`,

            massarCode:
              massar,

            name:
              nameAr,

            nameAr:
              nameAr,

            dateOfBirth:
              imported.dateOfBirth,

            classId:
              importClassId,

            // Backend compatibility only. Gender is not shown or requested in the UI.
            gender:
              'Male',
          } as Student;

          await addStudent(
            student
          );

          if (
            normalizedMassar
          ) {
            importedMassarCodes.add(
              normalizedMassar
            );

            existingMassarCodes.add(
              normalizedMassar
            );
          }

          added++;
        }

        if (added === 0) {
          throw new Error(
            'No new students were imported. They may already exist.'
          );
        }

        alert(
          `Import completed.\n\nAdded: ${added}\nSkipped: ${skipped}`
        );

        closeImport();
      } catch (error) {
        console.error(
          'Import failed:',
          error
        );

        setImportError(
          error instanceof Error
            ? error.message
            : 'Import failed.'
        );
      } finally {
        setImporting(false);
      }
    };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Students
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage student information and educational profiles
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={openImport}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <Upload size={18} />
              Import Excel
            </button>

            <button
              type="button"
              onClick={openAdd}
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              <Plus size={18} />
              Add Student
            </button>

          </div>
        </div>

        {/* FILTERS */}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <div className="relative">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by Arabic name, English name or Massar code..."
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-500 focus:bg-white"
              />

            </div>

            <select
              value={selectedClass}
              onChange={(e) =>
                setSelectedClass(
                  e.target.value
                )
              }
              className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
            >

              <option value="">
                All classes
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
                    {
                      classRoom.name
                    }
                  </option>
                )
              )}

            </select>

          </div>

        </div>

        {/* STATS */}

        <div className="mb-6 grid grid-cols-1 gap-4">

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="rounded-lg bg-gray-100 p-2.5">

                <Users
                  size={20}
                  className="text-gray-700"
                />

              </div>

              <div>

                <p className="text-sm text-gray-500">
                  Total Students
                </p>

                <p className="text-2xl font-bold text-gray-800">
                  {
                    students.length
                  }
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* BULK ACTIONS */}
        {selectedStudentIds.size > 0 && (
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-gray-700">
              {selectedStudentIds.size} student(s) selected
            </p>

            <button
              type="button"
              onClick={handleDeleteSelected}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
            >
              <Trash2 size={17} />
              Delete Selected
            </button>
          </div>
        )}

        {/* TABLE */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px]">

              <thead className="border-b border-gray-200 bg-gray-50">

                <tr>

                  <th className="w-12 px-5 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredStudents.length > 0 &&
                          filteredStudents.every((student) =>
                            selectedStudentIds.has(student.id)
                          )
                        }
                        ref={(element) => {
                          if (element) {
                            element.indeterminate =
                              filteredStudents.some((student) =>
                                selectedStudentIds.has(student.id)
                              ) &&
                              !filteredStudents.every((student) =>
                                selectedStudentIds.has(student.id)
                              );
                          }
                        }}
                        onChange={toggleSelectAll}
                        aria-label="Select all visible students"
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Student
                    </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Massar
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Class
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredStudents.length === 0 ? (
                  <tr>

                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-gray-500"
                    >
                      No students found.
                    </td>

                  </tr>
                ) : (
                  filteredStudents.map(
                    (student) => (
                      <tr
                        key={
                          student.id
                        }
                        className="transition hover:bg-gray-50"
                      >

                        <td className="w-12 px-5 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.has(student.id)}
                            onChange={() =>
                              toggleStudentSelection(student.id)
                            }
                            aria-label={`Select ${
                              student.nameAr ||
                              student.name
                            }`}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </td>

                        <td className="px-5 py-4">
<div>

                            <p
                              dir="rtl"
                              lang="ar"
                              className="font-medium text-gray-800"
                            >
                              {
                                student.nameAr ||
                                student.name
                              }
                            </p>

                            {student.name &&
                              student.name !==
                                student.nameAr && (
                                <p className="mt-0.5 text-xs text-gray-500">
                                  {
                                    student.name
                                  }
                                </p>
                              )}

                          </div>

                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {
                            student.massarCode ||
                            '-'
                          }
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {
                            getClassName(
                              student.classId
                            )
                          }
                        </td>

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  student
                                )
                              }
                              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  student
                                )
                              }
                              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* ===================================================
          ADD / EDIT MODAL
      =================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[95vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

              <div>

                <h2 className="text-lg font-bold text-gray-800">
                  {
                    editingStudent
                      ? 'Edit Student'
                      : 'Add Student'
                  }
                </h2>

                <p className="text-xs text-gray-500">
                  Student information
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>

            </div>

            <div className="max-h-[calc(95vh-140px)] overflow-y-auto p-6">

              {/* BASIC */}

              <SectionTitle
                title="Basic Information"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                <Input
                  label="Arabic Name *"
                  value={
                    form.nameAr ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'nameAr',
                      value
                    )
                  }
                  dir="rtl"
                  placeholder="مثال: آدم"
                />

                <Input
                  label="English Name"
                  value={
                    form.name ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'name',
                      value
                    )
                  }
                  placeholder="Adam"
                />

                <Input
                  label="Massar Code"
                  value={
                    form.massarCode ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'massarCode',
                      value
                    )
                  }
                />

                <Input
                  label="Date of Birth"
                  type="date"
                  value={
                    form.dateOfBirth ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'dateOfBirth',
                      value
                    )
                  }
                />

                <Select
                  label="Class *"
                  value={
                    form.classId ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'classId',
                      value
                    )
                  }
                  options={[
                    {
                      value: '',
                      label:
                        'Select class',
                    },
                    ...classes.map(
                      (item) => ({
                        value:
                          item.id,
                        label:
                          item.name,
                      })
                    ),
                  ]}
                />



              </div>

              {/* EDUCATIONAL */}

              <SectionTitle
                title="Educational Profile"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                <Select
                  label="Learning Style"
                  value={
                    form.learningStyle ||
                    'Not identified'
                  }
                  onChange={(value) =>
                    handleChange(
                      'learningStyle',
                      value as LearningStyle
                    )
                  }
                  options={options([
                    'Visual',
                    'Auditory',
                    'Reading/Writing',
                    'Kinesthetic',
                    'Mixed',
                    'Not identified',
                  ])}
                />

                <Select
                  label="Learning Preference"
                  value={
                    form.learningPreference ||
                    'Mixed'
                  }
                  onChange={(value) =>
                    handleChange(
                      'learningPreference',
                      value as LearningPreference
                    )
                  }
                  options={options([
                    'Individual work',
                    'Pair work',
                    'Group work',
                    'Mixed',
                  ])}
                />

                <Select
                  label="Participation"
                  value={
                    form.participationLevel ||
                    'Average'
                  }
                  onChange={(value) =>
                    handleChange(
                      'participationLevel',
                      value as ParticipationLevel
                    )
                  }
                  options={options([
                    'Active',
                    'Average',
                    'Quiet',
                    'Needs encouragement',
                  ])}
                />

                <Select
                  label="Learning Behaviour"
                  value={
                    form.learningBehaviour ||
                    'Mixed'
                  }
                  onChange={(value) =>
                    handleChange(
                      'learningBehaviour',
                      value as LearningBehaviour
                    )
                  }
                  options={options([
                    'Independent',
                    'Needs guidance',
                    'Easily distracted',
                    'Consistent',
                    'Mixed',
                  ])}
                />

                <Select
                  label="Motivation"
                  value={
                    form.motivationLevel ||
                    'Unknown'
                  }
                  onChange={(value) =>
                    handleChange(
                      'motivationLevel',
                      value as MotivationLevel
                    )
                  }
                  options={options([
                    'High',
                    'Good',
                    'Average',
                    'Low',
                    'Unknown',
                  ])}
                />

              </div>

              <TextArea
                label="Strengths"
                value={
                  form.strengths ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'strengths',
                    value
                  )
                }
              />

              <TextArea
                label="Areas for Improvement"
                value={
                  form.areasForImprovement ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'areasForImprovement',
                    value
                  )
                }
              />

              <TextArea
                label="Learning Needs"
                value={
                  form.learningNeeds ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'learningNeeds',
                    value
                  )
                }
              />

              <TextArea
                label="Educational Goals"
                value={
                  form.educationalGoals ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'educationalGoals',
                    value
                  )
                }
              />

              <TextArea
                label="Educational Notes"
                value={
                  form.educationalNotes ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'educationalNotes',
                    value
                  )
                }
              />

              {/* LANGUAGE */}

              <SectionTitle
                title="Language Profile"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                <Input
                  label="First Language"
                  value={
                    form.firstLanguage ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'firstLanguage',
                      value
                    )
                  }
                />

                <Input
                  label="Other Languages"
                  value={
                    form.otherLanguages ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'otherLanguages',
                      value
                    )
                  }
                />

                <SkillSelect
                  label="English Level"
                  value={
                    form.englishLevel
                  }
                  onChange={(value) =>
                    handleChange(
                      'englishLevel',
                      value
                    )
                  }
                />

                <SkillSelect
                  label="Speaking"
                  value={
                    form.speakingLevel
                  }
                  onChange={(value) =>
                    handleChange(
                      'speakingLevel',
                      value
                    )
                  }
                />

                <SkillSelect
                  label="Listening"
                  value={
                    form.listeningLevel
                  }
                  onChange={(value) =>
                    handleChange(
                      'listeningLevel',
                      value
                    )
                  }
                />

                <SkillSelect
                  label="Reading"
                  value={
                    form.readingLevel
                  }
                  onChange={(value) =>
                    handleChange(
                      'readingLevel',
                      value
                    )
                  }
                />

                <SkillSelect
                  label="Writing"
                  value={
                    form.writingLevel
                  }
                  onChange={(value) =>
                    handleChange(
                      'writingLevel',
                      value
                    )
                  }
                />

                <SkillSelect
                  label="Vocabulary"
                  value={
                    form.vocabularyLevel
                  }
                  onChange={(value) =>
                    handleChange(
                      'vocabularyLevel',
                      value
                    )
                  }
                />

                <SkillSelect
                  label="Grammar"
                  value={
                    form.grammarLevel
                  }
                  onChange={(value) =>
                    handleChange(
                      'grammarLevel',
                      value
                    )
                  }
                />

                <SkillSelect
                  label="Pronunciation"
                  value={
                    form.pronunciationLevel
                  }
                  onChange={(value) =>
                    handleChange(
                      'pronunciationLevel',
                      value
                    )
                  }
                />

              </div>

              {/* CLASSROOM */}

              <SectionTitle
                title="Classroom Behaviour"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                <Select
                  label="Classroom Behaviour"
                  value={
                    form.classroomBehaviour ||
                    'Good'
                  }
                  onChange={(value) =>
                    handleChange(
                      'classroomBehaviour',
                      value as ClassroomBehaviour
                    )
                  }
                  options={options([
                    'Excellent',
                    'Good',
                    'Average',
                    'Needs improvement',
                  ])}
                />

                <Select
                  label="Attention"
                  value={
                    form.attentionLevel ||
                    'Usually focused'
                  }
                  onChange={(value) =>
                    handleChange(
                      'attentionLevel',
                      value as AttentionLevel
                    )
                  }
                  options={options([
                    'Focused',
                    'Usually focused',
                    'Sometimes distracted',
                    'Frequently distracted',
                  ])}
                />

                <Select
                  label="Homework Completion"
                  value={
                    form.homeworkCompletion ||
                    'Usually'
                  }
                  onChange={(value) =>
                    handleChange(
                      'homeworkCompletion',
                      value as HomeworkCompletion
                    )
                  }
                  options={options([
                    'Always',
                    'Usually',
                    'Sometimes',
                    'Rarely',
                  ])}
                />

                <Select
                  label="Punctuality"
                  value={
                    form.punctuality ||
                    'Usually on time'
                  }
                  onChange={(value) =>
                    handleChange(
                      'punctuality',
                      value as PunctualityLevel
                    )
                  }
                  options={options([
                    'Always on time',
                    'Usually on time',
                    'Sometimes late',
                    'Frequently late',
                  ])}
                />

                <Select
                  label="Peer Interaction"
                  value={
                    form.peerInteraction ||
                    'Good'
                  }
                  onChange={(value) =>
                    handleChange(
                      'peerInteraction',
                      value as PeerInteraction
                    )
                  }
                  options={options([
                    'Excellent',
                    'Good',
                    'Average',
                    'Needs support',
                  ])}
                />

                <Select
                  label="Teacher Interaction"
                  value={
                    form.teacherInteraction ||
                    'Good'
                  }
                  onChange={(value) =>
                    handleChange(
                      'teacherInteraction',
                      value as TeacherInteraction
                    )
                  }
                  options={options([
                    'Excellent',
                    'Good',
                    'Average',
                    'Needs encouragement',
                  ])}
                />

              </div>

              <TextArea
                label="Behaviour Notes"
                value={
                  form.behaviourNotes ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'behaviourNotes',
                    value
                  )
                }
              />

              {/* ATTENDANCE */}

              <SectionTitle
                title="Attendance & Engagement"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                <Select
                  label="Attendance Pattern"
                  value={
                    form.attendancePattern ||
                    'Unknown'
                  }
                  onChange={(value) =>
                    handleChange(
                      'attendancePattern',
                      value as AttendancePattern
                    )
                  }
                  options={options([
                    'Regular',
                    'Occasional absences',
                    'Frequent absences',
                    'Unknown',
                  ])}
                />

                <Select
                  label="Engagement"
                  value={
                    form.engagementLevel ||
                    'Average'
                  }
                  onChange={(value) =>
                    handleChange(
                      'engagementLevel',
                      value as ParticipationLevel
                    )
                  }
                  options={options([
                    'Active',
                    'Average',
                    'Quiet',
                    'Needs encouragement',
                  ])}
                />

                <Input
                  label="Absence Reason"
                  value={
                    form.absenceReason ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'absenceReason',
                      value
                    )
                  }
                />

              </div>

              <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">

                <input
                  type="checkbox"
                  checked={
                    form.frequentLateness ||
                    false
                  }
                  onChange={(e) =>
                    handleChange(
                      'frequentLateness',
                      e.target.checked
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />

                Frequent lateness

              </label>

              <TextArea
                label="Engagement Notes"
                value={
                  form.engagementNotes ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'engagementNotes',
                    value
                  )
                }
              />

              {/* SOCIAL */}

              <SectionTitle
                title="Social & Family Context"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                <Input
                  label="Living Arrangement"
                  value={
                    form.livingArrangement ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'livingArrangement',
                      value
                    )
                  }
                />

                <Select
                  label="Family Support"
                  value={
                    form.familySupport ||
                    'Unknown'
                  }
                  onChange={(value) =>
                    handleChange(
                      'familySupport',
                      value as FamilySupport
                    )
                  }
                  options={options([
                    'Strong',
                    'Good',
                    'Limited',
                    'Unknown',
                  ])}
                />

                <Select
                  label="Home Learning Environment"
                  value={
                    form.homeLearningEnvironment ||
                    'Unknown'
                  }
                  onChange={(value) =>
                    handleChange(
                      'homeLearningEnvironment',
                      value as HomeLearningEnvironment
                    )
                  }
                  options={options([
                    'Supportive',
                    'Adequate',
                    'Limited',
                    'Unknown',
                  ])}
                />

                <Select
                  label="Learning Resources"
                  value={
                    form.accessToLearningResources ||
                    'Unknown'
                  }
                  onChange={(value) =>
                    handleChange(
                      'accessToLearningResources',
                      value as ResourceAccess
                    )
                  }
                  options={options([
                    'Good',
                    'Limited',
                    'None',
                    'Unknown',
                  ])}
                />

                <Select
                  label="Transportation Difficulty"
                  value={
                    form.transportationDifficulty ||
                    'No issue'
                  }
                  onChange={(value) =>
                    handleChange(
                      'transportationDifficulty',
                      value as DifficultyLevel
                    )
                  }
                  options={options([
                    'No issue',
                    'Sometimes difficult',
                    'Significant difficulty',
                    'Unknown',
                  ])}
                />

                <Select
                  label="Family Follow-up"
                  value={
                    form.familyFollowUp ||
                    'Not needed'
                  }
                  onChange={(value) =>
                    handleChange(
                      'familyFollowUp',
                      value as FamilyFollowUp
                    )
                  }
                  options={options([
                    'Not needed',
                    'Occasional',
                    'Regular',
                    'Required',
                  ])}
                />

              </div>

              <TextArea
                label="Social Support"
                value={
                  form.socialSupport ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'socialSupport',
                    value
                  )
                }
              />

              <TextArea
                label="Social & Educational Notes"
                value={
                  form.socialEducationalNotes ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'socialEducationalNotes',
                    value
                  )
                }
              />

              {/* SUPPORT */}

              <SectionTitle
                title="Health & Educational Support"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                <Select
                  label="Health Consideration"
                  value={
                    form.healthConsideration ||
                    'None'
                  }
                  onChange={(value) =>
                    handleChange(
                      'healthConsideration',
                      value as HealthConsideration
                    )
                  }
                  options={options([
                    'None',
                    'Known consideration',
                    'Requires attention',
                  ])}
                />

                <Select
                  label="Special Educational Needs"
                  value={
                    form.specialEducationalNeeds ||
                    'Not known'
                  }
                  onChange={(value) =>
                    handleChange(
                      'specialEducationalNeeds',
                      value as AccommodationStatus
                    )
                  }
                  options={options([
                    'None',
                    'Not known',
                    'Yes',
                  ])}
                />

                <Select
                  label="Learning Accommodation"
                  value={
                    form.learningAccommodationNeeded ||
                    'Not known'
                  }
                  onChange={(value) =>
                    handleChange(
                      'learningAccommodationNeeded',
                      value as AccommodationStatus
                    )
                  }
                  options={options([
                    'None',
                    'Not known',
                    'Yes',
                  ])}
                />

                <Select
                  label="Support Required"
                  value={
                    form.supportRequired ||
                    'None'
                  }
                  onChange={(value) =>
                    handleChange(
                      'supportRequired',
                      value as SupportRequired
                    )
                  }
                  options={options([
                    'None',
                    'Academic',
                    'Behavioural',
                    'Social',
                    'Multiple areas',
                  ])}
                />

              </div>

              <TextArea
                label="Health Notes"
                value={
                  form.healthNotes ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'healthNotes',
                    value
                  )
                }
              />

              <TextArea
                label="Accessibility Needs"
                value={
                  form.accessibilityNeeds ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'accessibilityNeeds',
                    value
                  )
                }
              />

              <TextArea
                label="Support Notes"
                value={
                  form.supportNotes ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'supportNotes',
                    value
                  )
                }
              />

              {/* INTERESTS */}

              <SectionTitle
                title="Interests & Motivation"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <Input
                  label="Interests"
                  value={
                    form.interests ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'interests',
                      value
                    )
                  }
                />

                <Input
                  label="Hobbies"
                  value={
                    form.hobbies ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'hobbies',
                      value
                    )
                  }
                />

                <Input
                  label="Favourite Topics"
                  value={
                    form.favouriteTopics ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'favouriteTopics',
                      value
                    )
                  }
                />

                <Input
                  label="Motivation Factors"
                  value={
                    form.motivationFactors ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'motivationFactors',
                      value
                    )
                  }
                />

                <Input
                  label="Career Interests"
                  value={
                    form.careerInterests ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'careerInterests',
                      value
                    )
                  }
                />

                <Input
                  label="Preferred Activities"
                  value={
                    form.preferredActivities ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'preferredActivities',
                      value
                    )
                  }
                />

              </div>

              {/* TEACHER PLAN */}

              <SectionTitle
                title="Teacher Support Plan"
              />

              <TextArea
                label="Recommended Support"
                value={
                  form.recommendedSupport ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'recommendedSupport',
                    value
                  )
                }
              />

              <TextArea
                label="Intervention Needed"
                value={
                  form.interventionNeeded ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'interventionNeeded',
                    value
                  )
                }
              />

              <TextArea
                label="Effective Strategies"
                value={
                  form.effectiveStrategies ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'effectiveStrategies',
                    value
                  )
                }
              />

              <TextArea
                label="Strategies to Avoid"
                value={
                  form.strategiesToAvoid ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'strategiesToAvoid',
                    value
                  )
                }
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <Input
                  label="Short Term Goal"
                  value={
                    form.shortTermGoal ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'shortTermGoal',
                      value
                    )
                  }
                />

                <Input
                  label="Follow-up Date"
                  type="date"
                  value={
                    form.followUpDate ||
                    ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'followUpDate',
                      value
                    )
                  }
                />

              </div>

              <TextArea
                label="Teacher Notes"
                value={
                  form.teacherNotes ||
                  ''
                }
                onChange={(value) =>
                  handleChange(
                    'teacherNotes',
                    value
                  )
                }
              />

            </div>

            {/* FOOTER */}

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
              >
                <Save size={17} />

                {
                  editingStudent
                    ? 'Update Student'
                    : 'Save Student'
                }
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ===================================================
          IMPORT MODAL
      =================================================== */}

      {importOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[95vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

              <div className="flex items-center gap-3">

                <div className="rounded-lg bg-gray-100 p-2">
                  <FileSpreadsheet
                    size={20}
                    className="text-gray-700"
                  />
                </div>

                <div>

                  <h2 className="text-lg font-bold text-gray-800">
                    Import Students from Excel
                  </h2>

                  <p className="text-xs text-gray-500">
                    Import students from an Excel spreadsheet
                  </p>

                </div>

              </div>

              <button
                type="button"
                disabled={importing}
                onClick={closeImport}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>

            {/* BODY */}

            <div className="max-h-[calc(95vh-150px)] overflow-y-auto p-6">

              <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">

                <div className="flex items-start gap-3">

                  <FileSpreadsheet
                    size={20}
                    className="mt-0.5 text-gray-600"
                  />

                  <div>

                    <p className="text-sm font-semibold text-gray-800">
                      Supported Excel format
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-600">
                      The importer automatically searches the worksheet for the student header row.
                    </p>

                    <ul className="mt-2 space-y-1 text-xs text-gray-600">

                      <li>
                        • رقم التلميذ / Massar Code
                      </li>

                      <li>
                        • إسم التلميذ / Arabic Name
                      </li>

                      <li>
                        • تاريخ الإزدياد / Date of Birth
                      </li>

                    </ul>

                  </div>

                </div>

              </div>

              {/* CLASS */}

              <div className="mb-5">

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Import students into
                </label>

                <select
                  value={importClassId}
                  onChange={(event) =>
                    setImportClassId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                >

                  <option value="">
                    Select class...
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
                        {
                          classRoom.name
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* FILE */}

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelFile}
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm font-medium text-gray-600 transition hover:border-gray-500 hover:bg-gray-100"
              >

                <Upload size={20} />

                {
                  importFileName ||
                  'Choose Excel File'
                }

              </button>

              {/* ERROR */}

              {importError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {importError}
                </div>
              )}

              {/* PREVIEW */}

              {importStudents.length > 0 && (
                <div className="mt-6">

                  <div className="mb-3">

                    <p className="text-sm font-semibold text-gray-800">
                      Preview
                    </p>

                    <p className="text-xs text-gray-500">
                      {
                        importStudents.length
                      } student(s) found
                    </p>

                  </div>

                  <div className="max-h-80 overflow-auto rounded-lg border border-gray-200">

                    <table className="w-full text-sm">

                      <thead className="sticky top-0 bg-gray-50">

                        <tr>

                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                            #
                          </th>

                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                            Massar Code
                          </th>

                          <th
                            className="px-3 py-2 text-right text-xs font-semibold text-gray-500"
                            dir="rtl"
                          >
                            الاسم بالعربية
                          </th>

                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                            Date of Birth
                          </th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-gray-100">

                        {importStudents.map(
                          (
                            student,
                            index
                          ) => (
                            <tr
                              key={`${student.massarCode}-${index}`}
                            >

                              <td className="px-3 py-2 text-gray-400">
                                {
                                  index + 1
                                }
                              </td>

                              <td className="px-3 py-2 font-medium text-gray-700">
                                {
                                  student.massarCode ||
                                  '—'
                                }
                              </td>

                              <td
                                dir="rtl"
                                lang="ar"
                                className="px-3 py-2 text-right font-medium text-gray-700"
                              >
                                {
                                  student.nameAr ||
                                  '—'
                                }
                              </td>

                              <td className="px-3 py-2 text-gray-600">
                                {
                                  formatDate(
                                    student.dateOfBirth
                                  )
                                }
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                </div>
              )}

            </div>

            {/* FOOTER */}

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">

              <button
                type="button"
                disabled={importing}
                onClick={closeImport}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  importing ||
                  !importStudents.length ||
                  !importClassId
                }
                onClick={confirmImport}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >

                <Upload size={17} />

                {importing
                  ? 'Importing...'
                  : `Import ${importStudents.length} Students`}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

/* =====================================================
   SECTION TITLE
===================================================== */

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <div className="mb-4 mt-8 first:mt-0">

      <h3 className="border-b border-gray-200 pb-2 text-sm font-bold uppercase tracking-wide text-gray-700">
        {title}
      </h3>

    </div>
  );
}

/* =====================================================
   INPUT
===================================================== */

function Input({
  label,
  value,
  onChange,
  type = 'text',
  dir,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  dir?: 'ltr' | 'rtl';
  placeholder?: string;
}) {
  return (
    <div>

      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        dir={dir}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:bg-white"
      />

    </div>
  );
}

/* =====================================================
   TEXT AREA
===================================================== */

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div className="mt-4">

      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        rows={3}
        className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:bg-white"
      />

    </div>
  );
}

/* =====================================================
   SELECT
===================================================== */

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <div>

      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
      >

        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          )
        )}

      </select>

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
    <Select
      label={label}
      value={
        value ||
        'Not assessed'
      }
      onChange={(value) =>
        onChange(
          value as SkillLevel
        )
      }
      options={options([
        'Strong',
        'Good',
        'Developing',
        'Needs Support',
        'Not assessed',
      ])}
    />
  );
}

/* =====================================================
   OPTIONS
===================================================== */

function options(
  values: string[]
) {
  return values.map(
    (value) => ({
      value,
      label: value,
    })
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

  if (
    parts.length !== 3
  ) {
    return value;
  }

  const [
    year,
    month,
    day,
  ] = parts;

  return `${day}-${month}-${year}`;
}