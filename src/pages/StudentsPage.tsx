import { useMemo, useState } from 'react';

import { useData } from '@/store/DataContext';

import type {
  Gender,
  Student,
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
} from 'lucide-react';


/*
 * =====================================================
 * EMPTY STUDENT
 * =====================================================
 */

const empty: Omit<Student, 'id'> = {
  name: '',
  nameAr: '',
  dateOfBirth: '',
  classId: '',
  gender: 'Male',
};


/*
 * =====================================================
 * STUDENTS PAGE
 * =====================================================
 */

export function StudentsPage() {

  const {
    data,
    setData,
    deleteStudent,
  } = useData();


  const [modalOpen, setModalOpen] =
    useState(false);

  const [editing, setEditing] =
    useState<Student | null>(null);

  const [form, setForm] =
    useState<Student>({} as Student);

  const [search, setSearch] =
    useState('');

  const [classFilter, setClassFilter] =
    useState('');

  const [profileId, setProfileId] =
    useState<string | null>(null);


  /*
   * =====================================================
   * CLASS NAME
   * =====================================================
   */

  const className = (id: string) =>
    data.classes.find(
      (c) => c.id === id
    )?.name ?? '—';


  /*
   * =====================================================
   * FILTERED STUDENTS
   * =====================================================
   */

  const filtered = useMemo(() => {

    return data.students.filter((student) => {

      /*
       * CLASS FILTER
       */

      if (
        classFilter &&
        student.classId !== classFilter
      ) {
        return false;
      }


      /*
       * SEARCH
       *
       * Search by:
       * - Arabic name
       * - ID
       */

      if (search) {

        const q =
          search.toLowerCase();


        const matchesArabicName =
          (
            student.nameAr ?? ''
          )
            .toLowerCase()
            .includes(q);


        const matchesId =
          student.id
            .toLowerCase()
            .includes(q);


        if (
          !matchesArabicName &&
          !matchesId
        ) {
          return false;
        }

      }


      return true;

    });

  }, [
    data.students,
    search,
    classFilter,
  ]);


  /*
   * =====================================================
   * ADD STUDENT
   * =====================================================
   */

  const openAdd = () => {

    setEditing(null);

    setForm({

      ...empty,

      id:
        nextStudentId(
          data.students
        ),

      classId:
        data.classes[0]?.id ?? '',

    });

    setModalOpen(true);

  };


  /*
   * =====================================================
   * EDIT STUDENT
   * =====================================================
   */

  const openEdit = (
    student: Student
  ) => {

    setEditing(student);

    setForm({

      ...student,

      nameAr:
        student.nameAr ?? '',

      dateOfBirth:
        student.dateOfBirth ?? '',

    });

    setModalOpen(true);

  };


  /*
   * =====================================================
   * SAVE STUDENT
   * =====================================================
   */

  const handleSave = () => {

    /*
     * Arabic name + class are required.
     */

    if (
      !form.nameAr?.trim() ||
      !form.classId
    ) {

      alert(
        'Arabic Name and Class are required.'
      );

      return;

    }


    /*
     * IMPORTANT
     *
     * We keep `name` internally so the
     * rest of the application continues
     * working.
     *
     * The visible name is `nameAr`.
     */

    const normalizedStudent: Student = {

      ...form,

      /*
       * Keep internal name synchronized
       * with Arabic name.
       */

      name:
        form.nameAr.trim(),

      nameAr:
        form.nameAr.trim(),

      dateOfBirth:
        form.dateOfBirth ?? '',

    };


    /*
     * =================================================
     * EDIT
     * =================================================
     */

    if (editing) {

      setData((currentData) => ({

        ...currentData,

        students:
          currentData.students.map(
            (student) =>
              student.id === editing.id
                ? normalizedStudent
                : student
          ),

      }));

    }


    /*
     * =================================================
     * ADD
     * =================================================
     */

    else {

      const idExists =
        data.students.some(
          (student) =>
            student.id ===
            normalizedStudent.id
        );


      if (idExists) {

        alert(
          'Student ID already exists.'
        );

        return;

      }


      setData((currentData) => ({

        ...currentData,

        students: [
          ...currentData.students,
          normalizedStudent,
        ],

      }));

    }


    setModalOpen(false);

    setEditing(null);

  };


  /*
   * =====================================================
   * DELETE STUDENT
   * =====================================================
   */

  const handleDelete = (
    student: Student
  ) => {

    const displayName =
      student.nameAr ||
      student.name ||
      student.id;


    const confirmed =
      window.confirm(

        `Delete student ${displayName}? This also removes their attendance, assessments and integrated activities.`

      );


    if (!confirmed) {
      return;
    }


    /*
     * Centralized delete function.
     */

    deleteStudent(
      student.id
    );


    /*
     * Close profile if necessary.
     */

    if (
      profileId === student.id
    ) {

      setProfileId(null);

    }

  };


  /*
   * =====================================================
   * STUDENT PROFILE
   * =====================================================
   */

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


  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (

    <div>

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-5 flex items-center justify-between">

        <h1 className="text-2xl font-bold text-slate-800">
          Students
        </h1>


        <button
          onClick={openAdd}
          disabled={
            data.classes.length === 0
          }
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >

          <Plus size={16} />

          Add Student

        </button>

      </div>


      {/* ================================================= */}
      {/* NO CLASS WARNING */}
      {/* ================================================= */}

      {data.classes.length === 0 && (

        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">

          Add a class first before
          adding students.

        </p>

      )}


      {/* ================================================= */}
      {/* SEARCH + FILTER */}
      {/* ================================================= */}

      <div className="mb-4 flex flex-wrap gap-3">

        {/* SEARCH */}

        <div className="relative min-w-[200px] flex-1">

          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />


          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search by Arabic name or ID..."
            className="form-input pl-9"
          />

        </div>


        {/* CLASS FILTER */}

        <select
          value={classFilter}
          onChange={(e) =>
            setClassFilter(
              e.target.value
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


      {/* ================================================= */}
      {/* STUDENTS TABLE */}
      {/* ================================================= */}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">

        <table className="w-full text-sm">

          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">

            <tr>

              <th className="px-4 py-3 font-semibold">
                Student ID
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

            {filtered.length === 0 && (

              <tr>

                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-slate-400"
                >

                  No students found.

                </td>

              </tr>

            )}


            {filtered.map(
              (student) => {

                const sum =
                  summarizeStudent(
                    student,
                    data.attendance,
                    data.assessments
                  );


                return (

                  <tr
                    key={student.id}
                    className="cursor-pointer hover:bg-slate-50/60"
                    onClick={() =>
                      setProfileId(
                        student.id
                      )
                    }
                  >

                    {/* STUDENT ID */}

                    <td className="px-4 py-3 font-medium text-slate-700">

                      {student.id}

                    </td>


                    {/* ARABIC NAME */}

                    <td
                      className="px-4 py-3 text-right font-medium text-slate-700"
                      dir="rtl"
                      lang="ar"
                    >

                      {student.nameAr ||
                        '—'}

                    </td>


                    {/* DATE OF BIRTH */}

                    <td className="px-4 py-3 text-slate-600">

                      {formatDate(
                        student.dateOfBirth
                      )}

                    </td>


                    {/* CLASS */}

                    <td className="px-4 py-3 text-slate-600">

                      {className(
                        student.classId
                      )}

                    </td>


                    {/* GENDER */}

                    <td className="px-4 py-3 text-slate-600">

                      {student.gender}

                    </td>


                    {/* ATTENDANCE */}

                    <td className="px-4 py-3 text-slate-600">

                      {sum.totalSessions > 0

                        ? fmtPct(
                            sum.attendanceRate
                          )

                        : '-'

                      }

                    </td>


                    {/* AVERAGE */}

                    <td className="px-4 py-3 text-slate-600">

                      {fmtPct(
                        sum.averageScore
                      )}

                    </td>


                    {/* STATUS */}

                    <td className="px-4 py-3">

                      <StatusBadge
                        status={
                          sum.status
                        }
                      />

                    </td>


                    {/* ACTIONS */}

                    <td
                      className="px-4 py-3"
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >

                      <div className="flex justify-end gap-1">

                        {/* EDIT */}

                        <button
                          onClick={() =>
                            openEdit(
                              student
                            )
                          }
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-sky-600"
                          aria-label="Edit"
                          type="button"
                        >

                          <Pencil
                            size={16}
                          />

                        </button>


                        {/* DELETE */}

                        <button
                          onClick={() =>
                            handleDelete(
                              student
                            )
                          }
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                          aria-label="Delete"
                          type="button"
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


      {/* ================================================= */}
      {/* ADD / EDIT MODAL */}
      {/* ================================================= */}

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

        <div className="space-y-4">

          {/* ================================================= */}
          {/* STUDENT ID */}
          {/* ================================================= */}

          <Field label="Student ID">

            <input
              value={form.id}
              disabled
              className="form-input bg-slate-50"
            />

          </Field>


          {/* ================================================= */}
          {/* ARABIC NAME ONLY */}
          {/* ================================================= */}

          <Field label="الاسم بالعربية">

            <input
              value={
                form.nameAr ?? ''
              }
              onChange={(e) =>
                setForm({

                  ...form,

                  /*
                   * Keep internal `name`
                   * synchronized.
                   */

                  name:
                    e.target.value,

                  nameAr:
                    e.target.value,

                })
              }
              placeholder="مثال: حراك آدم"
              dir="rtl"
              lang="ar"
              className="form-input text-right"
            />


            <p
              className="mt-1 text-xs text-slate-400"
              dir="rtl"
            >

              هذا الاسم سيظهر في التقرير
              الرسمي باللغة العربية.

            </p>

          </Field>


          {/* ================================================= */}
          {/* DATE OF BIRTH */}
          {/* ================================================= */}

          <Field label="Date of Birth">

            <input
              type="date"
              value={
                form.dateOfBirth ?? ''
              }
              onChange={(e) =>
                setForm({

                  ...form,

                  dateOfBirth:
                    e.target.value,

                })
              }
              className="form-input"
            />

          </Field>


          {/* ================================================= */}
          {/* CLASS */}
          {/* ================================================= */}

          <Field label="Class">

            <select
              value={form.classId}
              onChange={(e) =>
                setForm({

                  ...form,

                  classId:
                    e.target.value,

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
                    key={classRoom.id}
                    value={classRoom.id}
                  >

                    {classRoom.name}

                  </option>

                )
              )}

            </select>

          </Field>


          {/* ================================================= */}
          {/* GENDER */}
          {/* ================================================= */}

          <Field label="Gender">

            <select
              value={form.gender}
              onChange={(e) =>
                setForm({

                  ...form,

                  gender:
                    e.target.value as Gender,

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


          {/* ================================================= */}
          {/* BUTTONS */}
          {/* ================================================= */}

          <div className="flex justify-end gap-2 pt-2">

            <button
              onClick={() =>
                setModalOpen(false)
              }
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              type="button"
            >

              Cancel

            </button>


            <button
              onClick={handleSave}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
              type="button"
            >

              {editing
                ? 'Save Changes'
                : 'Add Student'}

            </button>

          </div>

        </div>

      </Modal>

    </div>

  );

}


/*
 * =====================================================
 * DATE FORMAT
 * =====================================================
 */

function formatDate(
  value?: string
) {

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