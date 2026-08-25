import { useState } from 'react';
import { useData } from '@/store/DataContext';
import type { ClassRoom } from '@/types';
import { Modal } from '@/components/Modal';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const LEVELS = ['1APIC', '2APIC', '3APIC'] as const;

/* =====================================================
   CURRENT ACADEMIC YEAR
   ===================================================== */

const CURRENT_ACADEMIC_YEAR = '2026/2027';

const empty: ClassRoom = {
  id: '',
  name: '',
  grade: '1APIC',
  academicYear: CURRENT_ACADEMIC_YEAR,
};

export function ClassesPage() {
  const { data, setData } = useData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRoom | null>(null);
  const [form, setForm] = useState<ClassRoom>(empty);

  /* =====================================================
     GENERATE INTERNAL ID
     ===================================================== */

  const suggestId = () => {
    let n = 1;

    const ids = new Set(
      data.classes.map((classRoom) => classRoom.id)
    );

    while (ids.has(`C${String(n).padStart(2, '0')}`)) {
      n++;
    }

    return `C${String(n).padStart(2, '0')}`;
  };

  /* =====================================================
     ADD CLASS
     ===================================================== */

  const openAdd = () => {
    setEditing(null);

    setForm({
      id: suggestId(),
      name: '',
      grade: '1APIC',
      academicYear: CURRENT_ACADEMIC_YEAR,
    });

    setModalOpen(true);
  };

  /* =====================================================
     EDIT CLASS
     ===================================================== */

  const openEdit = (classRoom: ClassRoom) => {
    setEditing(classRoom);
    setForm({ ...classRoom });
    setModalOpen(true);
  };

  /* =====================================================
     SAVE CLASS
     ===================================================== */

  const handleSave = () => {
    const name = form.name.trim();
    const grade = form.grade.trim();
    const academicYear = form.academicYear.trim();

    /* =================================================
       VALIDATION
       ================================================= */

    if (!name) {
      alert('Class Name is required.');
      return;
    }

    if (!grade) {
      alert('Level is required.');
      return;
    }

    if (!academicYear) {
      alert('Academic Year is required.');
      return;
    }

    /* =================================================
       CHECK DUPLICATE

       A class is considered duplicate ONLY when:
       - Class Name is the same
       - Level is the same
       - Academic Year is the same

       Example:

       1APIC / 1 / 2026/2027   ✅
       2APIC / 1 / 2026/2027   ✅

       But:

       1APIC / 1 / 2026/2027   ❌
       1APIC / 1 / 2026/2027   ❌
       ================================================= */

    const duplicate = data.classes.some(
      (classRoom) =>
        classRoom.id !== editing?.id &&
        classRoom.name.trim().toLowerCase() ===
          name.toLowerCase() &&
        classRoom.grade.trim().toLowerCase() ===
          grade.toLowerCase() &&
        classRoom.academicYear.trim().toLowerCase() ===
          academicYear.toLowerCase()
    );

    if (duplicate) {
      alert(
        `Class "${name}" already exists in ${grade} for ${academicYear}.`
      );
      return;
    }

    /* =================================================
       EDIT EXISTING CLASS
       ================================================= */

    if (editing) {
      setData((currentData) => ({
        ...currentData,

        classes: currentData.classes.map(
          (classRoom) =>
            classRoom.id === editing.id
              ? {
                  ...form,
                  name,
                  grade,
                  academicYear,
                }
              : classRoom
        ),
      }));

      setModalOpen(false);
      setEditing(null);

      return;
    }

    /* =================================================
       ADD NEW CLASS
       ================================================= */

    const newClass: ClassRoom = {
      ...form,
      id: suggestId(),
      name,
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

    setModalOpen(false);
    setEditing(null);
  };

  /* =====================================================
     DELETE CLASS
     ===================================================== */

  const handleDelete = (classRoom: ClassRoom) => {
    const studentCount =
      data.students.filter(
        (student) =>
          student.classId === classRoom.id
      ).length;

    const message =
      studentCount > 0
        ? `Delete class ${classRoom.name}? ${studentCount} student(s) will remain but lose their class link.`
        : `Delete class ${classRoom.name}?`;

    if (!window.confirm(message)) {
      return;
    }

    setData((currentData) => ({
      ...currentData,

      /* REMOVE CLASS */

      classes:
        currentData.classes.filter(
          (item) =>
            item.id !== classRoom.id
        ),

      /* UNLINK STUDENTS */

      students:
        currentData.students.map(
          (student) =>
            student.classId === classRoom.id
              ? {
                  ...student,
                  classId: '',
                }
              : student
        ),

      /* REMOVE ATTENDANCE */

      attendance:
        currentData.attendance.filter(
          (attendance) =>
            attendance.classId !==
            classRoom.id
        ),

      /* REMOVE ASSESSMENTS */

      assessments:
        currentData.assessments.filter(
          (assessment) =>
            assessment.classId !==
            classRoom.id
        ),

      /* REMOVE INTEGRATED ACTIVITIES */

      integratedActivities:
        currentData.integratedActivities?.filter(
          (activity) =>
            activity.classId !==
            classRoom.id
        ) ?? [],
    }));
  };

  /* =====================================================
     SORT CLASSES
     ===================================================== */

  const sortedClasses = [
    ...data.classes,
  ].sort((a, b) => {
    const levelA =
      LEVELS.indexOf(
        a.grade as (typeof LEVELS)[number]
      );

    const levelB =
      LEVELS.indexOf(
        b.grade as (typeof LEVELS)[number]
      );

    /* LEVEL ORDER */

    if (levelA !== levelB) {
      return levelA - levelB;
    }

    /* ACADEMIC YEAR */

    const yearCompare =
      a.academicYear.localeCompare(
        b.academicYear
      );

    if (yearCompare !== 0) {
      return yearCompare;
    }

    /* CLASS NAME */

    return a.name.localeCompare(
      b.name,
      undefined,
      {
        numeric: true,
        sensitivity: 'base',
      }
    );
  });

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div>
      {/* =================================================
          HEADER
          ================================================= */}

      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          Classes
        </h1>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
        >
          <Plus size={16} />
          Add Class
        </button>
      </div>

      {/* =================================================
          TABLE
          ================================================= */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">
                Class Name
              </th>

              <th className="px-4 py-3 font-semibold">
                Level
              </th>

              <th className="px-4 py-3 font-semibold">
                Academic Year
              </th>

              <th className="px-4 py-3 font-semibold">
                Students
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sortedClasses.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No classes yet. Click "Add Class" to create one.
                </td>
              </tr>
            )}

            {sortedClasses.map(
              (classRoom) => {
                const count =
                  data.students.filter(
                    (student) =>
                      student.classId ===
                      classRoom.id
                  ).length;

                return (
                  <tr
                    key={classRoom.id}
                    className="hover:bg-slate-50/60"
                  >
                    {/* CLASS NAME */}

                    <td className="px-4 py-3 font-medium text-slate-700">
                      {classRoom.name}
                    </td>

                    {/* LEVEL */}

                    <td className="px-4 py-3 text-slate-700">
                      {classRoom.grade}
                    </td>

                    {/* ACADEMIC YEAR */}

                    <td className="px-4 py-3 text-slate-700">
                      {classRoom.academicYear}
                    </td>

                    {/* STUDENTS */}

                    <td className="px-4 py-3 text-slate-500">
                      {count}
                    </td>

                    {/* ACTIONS */}

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            openEdit(
                              classRoom
                            )
                          }
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-sky-600"
                          aria-label="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              classRoom
                            )
                          }
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
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
            ? 'Edit Class'
            : 'Add Class'
        }
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      >
        <div className="space-y-4">

          {/* =================================================
              LEVEL
              ================================================= */}

          <Field label="Level">
            <select
              value={form.grade}
              onChange={(event) => {
                setForm(
                  (current) => ({
                    ...current,
                    grade:
                      event.target.value,
                  })
                );
              }}
              className="form-select"
            >
              {LEVELS.map(
                (level) => (
                  <option
                    key={level}
                    value={level}
                  >
                    {level}
                  </option>
                )
              )}
            </select>
          </Field>

          {/* =================================================
              ACADEMIC YEAR
              ================================================= */}

          <Field label="Academic Year">
            <select
              value={form.academicYear}
              onChange={(event) => {
                setForm(
                  (current) => ({
                    ...current,
                    academicYear:
                      event.target.value,
                  })
                );
              }}
              className="form-select"
            >
              <option value="2026/2027">
                2026/2027
              </option>
            </select>
          </Field>

          {/* =================================================
              CLASS NAME
              ================================================= */}

          <Field label="Class Name">
            <input
              value={form.name}
              onChange={(event) => {
                setForm(
                  (current) => ({
                    ...current,
                    name:
                      event.target.value,
                  })
                );
              }}
              placeholder="Example: 1"
              className="form-input"
            />
          </Field>

          {/* =================================================
              BUTTONS
              ================================================= */}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                setEditing(null);
              }}
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
                : 'Add Class'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* =====================================================
   FIELD
   ===================================================== */

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>

      {children}
    </label>
  );
}