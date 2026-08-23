import { useState } from 'react';
import { useData } from '@/store/DataContext';
import type { ClassRoom } from '@/types';
import { Modal } from '@/components/Modal';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const LEVELS = ['1APIC', '2APIC', '3APIC'] as const;

const empty: ClassRoom = {
  id: '',
  name: '',
  grade: '1APIC',
  academicYear: '',
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
     GENERATE NEXT CLASS NAME
     
     1APIC-1
     1APIC-2
     ...
     1APIC-12
     
     2APIC-1
     2APIC-2
     ...
     ===================================================== */

  const getNextClassName = (
    grade: string,
    academicYear: string
  ) => {
    let maxNumber = 0;

    const prefix = `${grade}-`;

    for (const classRoom of data.classes) {
      if (
        classRoom.grade !== grade ||
        classRoom.academicYear !== academicYear
      ) {
        continue;
      }

      if (!classRoom.name.startsWith(prefix)) {
        continue;
      }

      const number = Number(
        classRoom.name.slice(prefix.length)
      );

      if (
        Number.isFinite(number) &&
        number > maxNumber
      ) {
        maxNumber = number;
      }
    }

    return `${grade}-${maxNumber + 1}`;
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
      academicYear: '',
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
    const grade = form.grade.trim();
    const academicYear =
      form.academicYear.trim();

    if (!grade) {
      alert('Level is required.');
      return;
    }

    if (!academicYear) {
      alert('Academic Year is required.');
      return;
    }

    /* =================================================
       EDIT
       ================================================= */

    if (editing) {
      setData((currentData) => ({
        ...currentData,

        classes: currentData.classes.map(
          (classRoom) =>
            classRoom.id === editing.id
              ? {
                  ...form,
                  name: form.name.trim(),
                  grade,
                  academicYear,
                }
              : classRoom
        ),
      }));

      setModalOpen(false);
      return;
    }

    /* =================================================
       ADD
       ================================================= */

    const className = getNextClassName(
      grade,
      academicYear
    );

    const newClass: ClassRoom = {
      ...form,
      id: suggestId(),
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

    setModalOpen(false);
  };

  /* =====================================================
     DELETE CLASS
     ===================================================== */

  const handleDelete = (
    classRoom: ClassRoom
  ) => {
    const studentCount =
      data.students.filter(
        (student) =>
          student.classId === classRoom.id
      ).length;

    const message =
      studentCount > 0
        ? `Delete class ${classRoom.name}? ${studentCount} student(s) will remain but lose their class link.`
        : `Delete class ${classRoom.name}?`;

    if (!confirm(message)) {
      return;
    }

    setData((currentData) => ({
      ...currentData,

      classes:
        currentData.classes.filter(
          (item) =>
            item.id !== classRoom.id
        ),

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

      attendance:
        currentData.attendance.filter(
          (attendance) =>
            attendance.classId !==
            classRoom.id
        ),

      assessments:
        currentData.assessments.filter(
          (assessment) =>
            assessment.classId !==
            classRoom.id
        ),

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

    if (levelA !== levelB) {
      return levelA - levelB;
    }

    const prefixA = `${a.grade}-`;
    const prefixB = `${b.grade}-`;

    const numberA = Number(
      a.name.startsWith(prefixA)
        ? a.name.slice(prefixA.length)
        : ''
    );

    const numberB = Number(
      b.name.startsWith(prefixB)
        ? b.name.slice(prefixB.length)
        : ''
    );

    if (
      Number.isFinite(numberA) &&
      Number.isFinite(numberB)
    ) {
      return numberA - numberB;
    }

    return a.name.localeCompare(b.name);
  });

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

            {sortedClasses.map((classRoom) => {
              const count =
                data.students.filter(
                  (student) =>
                    student.classId === classRoom.id
                ).length;

              return (
                <tr
                  key={classRoom.id}
                  className="hover:bg-slate-50/60"
                >
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {classRoom.name}
                  </td>

                  <td className="px-4 py-3 text-slate-700">
                    {classRoom.grade}
                  </td>

                  <td className="px-4 py-3 text-slate-700">
                    {classRoom.academicYear}
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {count}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() =>
                          openEdit(classRoom)
                        }
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-sky-600"
                        aria-label="Edit"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(classRoom)
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
            })}
          </tbody>
        </table>
      </div>

      {/* =================================================
          MODAL
          ================================================= */}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Class' : 'Add Class'}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">

          {/* LEVEL */}

          <Field label="Level">
            <select
              value={form.grade}
              onChange={(event) => {
                const newGrade =
                  event.target.value;

                setForm((current) => ({
                  ...current,
                  grade: newGrade,
                  name: '',
                }));
              }}
              className="form-select"
            >
              {LEVELS.map((level) => (
                <option
                  key={level}
                  value={level}
                >
                  {level}
                </option>
              ))}
            </select>
          </Field>

          {/* ACADEMIC YEAR */}

          <Field label="Academic Year">
            <input
              value={form.academicYear}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  academicYear:
                    event.target.value,
                  name: '',
                }));
              }}
              placeholder="2026/2027"
              className="form-input"
            />
          </Field>

          {/* CLASS NAME */}

          <Field label="Class Name">
            <input
              value={
                editing
                  ? form.name
                  : form.grade &&
                    form.academicYear
                    ? getNextClassName(
                        form.grade,
                        form.academicYear
                      )
                    : ''
              }
              readOnly
              className="form-input bg-slate-50"
            />

            {!editing && (
              <p className="mt-1 text-xs text-slate-400">
                Generated automatically.
              </p>
            )}
          </Field>

          {/* BUTTONS */}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() =>
                setModalOpen(false)
              }
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
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