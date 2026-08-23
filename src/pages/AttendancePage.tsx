import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useData } from '@/store/DataContext';

import type {
  AttendanceStatus,
  Term,
} from '@/types';

const VIEW_MODES = [
  'Daily',
  'Weekly',
  'Monthly',
  'Term',
] as const;

type ViewMode = (typeof VIEW_MODES)[number];

const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  'Present',
  'Late',
  'Absent',
];

/* =====================================================
   DATE HELPERS
   ===================================================== */

const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

const getToday = () => {
  return formatDate(new Date());
};

const getStartOfWeek = (dateString: string) => {
  const date = new Date(
    `${dateString}T00:00:00`
  );

  const day = date.getDay();

  const difference =
    day === 0 ? -6 : 1 - day;

  date.setDate(
    date.getDate() + difference
  );

  return formatDate(date);
};

const getEndOfWeek = (dateString: string) => {
  const date = new Date(
    `${getStartOfWeek(dateString)}T00:00:00`
  );

  date.setDate(
    date.getDate() + 6
  );

  return formatDate(date);
};

const getStartOfMonth = (
  dateString: string
) => {
  const date = new Date(
    `${dateString}T00:00:00`
  );

  date.setDate(1);

  return formatDate(date);
};

const getEndOfMonth = (
  dateString: string
) => {
  const date = new Date(
    `${dateString}T00:00:00`
  );

  date.setMonth(
    date.getMonth() + 1
  );

  date.setDate(0);

  return formatDate(date);
};

const generateAttendanceId = (
  existingIds: string[]
) => {
  let number = 1;

  const ids = new Set(existingIds);

  while (
    ids.has(
      `ATT${String(number).padStart(4, '0')}`
    )
  ) {
    number++;
  }

  return `ATT${String(number).padStart(4, '0')}`;
};

/* =====================================================
   PERIOD
   ===================================================== */

const getDateRange = (
  mode: ViewMode,
  selectedDate: string,
  selectedTerm: Term
) => {
  if (mode === 'Daily') {
    return {
      start: selectedDate,
      end: selectedDate,
    };
  }

  if (mode === 'Weekly') {
    return {
      start:
        getStartOfWeek(selectedDate),

      end:
        getEndOfWeek(selectedDate),
    };
  }

  if (mode === 'Monthly') {
    return {
      start:
        getStartOfMonth(selectedDate),

      end:
        getEndOfMonth(selectedDate),
    };
  }

  /*
   * ===================================================
   * TERM
   *
   * First Term:
   * September -> December
   *
   * Second Term:
   * January -> June
   * ===================================================
   */

  const date = new Date(
    `${selectedDate}T00:00:00`
  );

  const month =
    date.getMonth() + 1;

  const year =
    date.getFullYear();

  if (
    selectedTerm ===
    'First Term'
  ) {
    if (month >= 9) {
      return {
        start: `${year}-09-01`,
        end: `${year}-12-31`,
      };
    }

    return {
      start: `${year - 1}-09-01`,
      end: `${year - 1}-12-31`,
    };
  }

  /*
   * Second Term
   */

  if (month <= 6) {
    return {
      start: `${year}-01-01`,
      end: `${year}-06-30`,
    };
  }

  return {
    start: `${year + 1}-01-01`,
    end: `${year + 1}-06-30`,
  };
};

/* =====================================================
   PERIOD LABEL
   ===================================================== */

const getPeriodLabel = (
  mode: ViewMode,
  selectedDate: string,
  selectedTerm: Term
) => {
  if (mode === 'Daily') {
    return selectedDate;
  }

  if (mode === 'Weekly') {
    return `${getStartOfWeek(
      selectedDate
    )} → ${getEndOfWeek(
      selectedDate
    )}`;
  }

  if (mode === 'Monthly') {
    const date = new Date(
      `${selectedDate}T00:00:00`
    );

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'long',
        year: 'numeric',
      }
    );
  }

  return selectedTerm;
};

/* =====================================================
   STATUS STYLE
   ===================================================== */

const getStatusStyle = (
  status: AttendanceStatus
) => {
  if (
    status === 'Present'
  ) {
    return 'bg-green-100 text-green-700';
  }

  if (
    status === 'Absent'
  ) {
    return 'bg-red-100 text-red-700';
  }

  return 'bg-yellow-100 text-yellow-700';
};

/* =====================================================
   PAGE
   ===================================================== */

export function AttendancePage() {
  const {
    data,
    setData,
  } = useData();

  const [viewMode, setViewMode] =
    useState<ViewMode>('Daily');

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(getToday());

  const [
    selectedClassId,
    setSelectedClassId,
  ] = useState('');

  const [
    selectedTerm,
    setSelectedTerm,
  ] = useState<Term>(
    'First Term'
  );

  const [search, setSearch] =
    useState('');

  /* ===================================================
     SELECT CLASS
     =================================================== */

  useEffect(() => {
    if (
      data.classes.length === 0
    ) {
      setSelectedClassId('');
      return;
    }

    const currentClassExists =
      data.classes.some(
        (classRoom) =>
          classRoom.id ===
          selectedClassId
      );

    if (
      !currentClassExists
    ) {
      setSelectedClassId(
        data.classes[0].id
      );
    }
  }, [
    data.classes,
    selectedClassId,
  ]);

  /* ===================================================
     SELECTED CLASS
     =================================================== */

  const selectedClass = useMemo(() => {
    return data.classes.find(
      (classRoom) =>
        classRoom.id ===
        selectedClassId
    );
  }, [
    data.classes,
    selectedClassId,
  ]);

  /* ===================================================
     DATE RANGE
     =================================================== */

  const dateRange = useMemo(() => {
    return getDateRange(
      viewMode,
      selectedDate,
      selectedTerm
    );
  }, [
    viewMode,
    selectedDate,
    selectedTerm,
  ]);

  /* ===================================================
     CLASS STUDENTS
     =================================================== */

  const classStudents = useMemo(() => {
    if (
      !selectedClassId
    ) {
      return [];
    }

    return data.students.filter(
      (student) =>
        student.classId ===
        selectedClassId
    );
  }, [
    data.students,
    selectedClassId,
  ]);

  /* ===================================================
     PERIOD ATTENDANCE
     =================================================== */

  const periodAttendance =
    useMemo(() => {
      if (
        !selectedClassId
      ) {
        return [];
      }

      return data.attendance.filter(
        (record) =>
          record.classId ===
            selectedClassId &&
          record.date >=
            dateRange.start &&
          record.date <=
            dateRange.end
      );
    }, [
      data.attendance,
      selectedClassId,
      dateRange,
    ]);

  /* ===================================================
     SEARCH
     =================================================== */

  const filteredStudents =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return classStudents;
      }

      return classStudents.filter(
        (student) =>
          student.name
            .toLowerCase()
            .includes(query) ||
          student.nameAr
            ?.toLowerCase()
            .includes(query) ||
          student.id
            .toLowerCase()
            .includes(query)
      );
    }, [
      classStudents,
      search,
    ]);

  /* ===================================================
     DAILY STATUS
     =================================================== */

  const getStudentDailyStatus = (
    studentId: string
  ): AttendanceStatus | null => {
    return (
      periodAttendance.find(
        (record) =>
          record.studentId ===
            studentId &&
          record.date ===
            selectedDate
      )?.status ?? null
    );
  };

  /* ===================================================
     STUDENT PERIOD SUMMARY
     =================================================== */

  const getStudentAttendanceSummary = (
    studentId: string
  ) => {
    const records =
      periodAttendance.filter(
        (record) =>
          record.studentId ===
          studentId
      );

    const present =
      records.filter(
        (record) =>
          record.status ===
          'Present'
      ).length;

    const late =
      records.filter(
        (record) =>
          record.status ===
          'Late'
      ).length;

    const absent =
      records.filter(
        (record) =>
          record.status ===
          'Absent'
      ).length;

    const marked =
      present +
      late +
      absent;

    const attendanceRate =
      marked === 0
        ? 0
        : Math.round(
            ((present + late) /
              marked) *
              100
          );

    return {
      present,
      late,
      absent,
      marked,
      attendanceRate,
    };
  };

  /* ===================================================
     STATISTICS
     =================================================== */

  const statistics = useMemo(() => {
    const present =
      periodAttendance.filter(
        (record) =>
          record.status ===
          'Present'
      ).length;

    const late =
      periodAttendance.filter(
        (record) =>
          record.status ===
          'Late'
      ).length;

    const absent =
      periodAttendance.filter(
        (record) =>
          record.status ===
          'Absent'
      ).length;

    const marked =
      present +
      late +
      absent;

    const attendanceRate =
      marked === 0
        ? 0
        : Math.round(
            ((present + late) /
              marked) *
              100
          );

    return {
      total:
        classStudents.length,

      present,

      absent,

      late,

      marked,

      attendanceRate,
    };
  }, [
    classStudents.length,
    periodAttendance,
  ]);

  /* ===================================================
     UPDATE ATTENDANCE
     =================================================== */

  const updateAttendance = (
    studentId: string,
    status: AttendanceStatus
  ) => {
    if (
      !selectedClassId
    ) {
      return;
    }

    /*
     * Attendance is always recorded
     * for the selected date.
     *
     * Weekly / Monthly / Term are
     * reporting views.
     */

    setData((currentData) => {
      const existing =
        currentData.attendance.find(
          (record) =>
            record.studentId ===
              studentId &&
            record.classId ===
              selectedClassId &&
            record.date ===
              selectedDate
        );

      if (existing) {
        return {
          ...currentData,

          attendance:
            currentData.attendance.map(
              (record) =>
                record.id ===
                existing.id
                  ? {
                      ...record,
                      status,
                    }
                  : record
            ),
        };
      }

      const newRecord = {
        id:
          generateAttendanceId(
            currentData.attendance.map(
              (record) =>
                record.id
            )
          ),

        studentId,

        classId:
          selectedClassId,

        date:
          selectedDate,

        status,
      };

      return {
        ...currentData,

        attendance: [
          ...currentData.attendance,
          newRecord,
        ],
      };
    });
  };

  /* ===================================================
     MARK ALL PRESENT
     =================================================== */

  const markAllPresent = () => {
    if (
      !selectedClassId
    ) {
      return;
    }

    setData((currentData) => {
      const attendance = [
        ...currentData.attendance,
      ];

      for (
        const student
        of classStudents
      ) {
        const index =
          attendance.findIndex(
            (record) =>
              record.studentId ===
                student.id &&
              record.classId ===
                selectedClassId &&
              record.date ===
                selectedDate
          );

        if (index !== -1) {
          attendance[index] = {
            ...attendance[index],
            status: 'Present',
          };
        } else {
          attendance.push({
            id:
              generateAttendanceId(
                attendance.map(
                  (record) =>
                    record.id
                )
              ),

            studentId:
              student.id,

            classId:
              selectedClassId,

            date:
              selectedDate,

            status: 'Present',
          });
        }
      }

      return {
        ...currentData,
        attendance,
      };
    });
  };

  /* ===================================================
     MARK ALL ABSENT
     =================================================== */

  const markAllAbsent = () => {
    if (
      !selectedClassId
    ) {
      return;
    }

    setData((currentData) => {
      const attendance = [
        ...currentData.attendance,
      ];

      for (
        const student
        of classStudents
      ) {
        const index =
          attendance.findIndex(
            (record) =>
              record.studentId ===
                student.id &&
              record.classId ===
                selectedClassId &&
              record.date ===
                selectedDate
          );

        if (index !== -1) {
          attendance[index] = {
            ...attendance[index],
            status: 'Absent',
          };
        } else {
          attendance.push({
            id:
              generateAttendanceId(
                attendance.map(
                  (record) =>
                    record.id
                )
              ),

            studentId:
              student.id,

            classId:
              selectedClassId,

            date:
              selectedDate,

            status: 'Absent',
          });
        }
      }

      return {
        ...currentData,
        attendance,
      };
    });
  };

  /* ===================================================
     NO CLASSES
     =================================================== */

  if (
    data.classes.length === 0
  ) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">

          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <h1 className="text-2xl font-bold text-gray-900">
              Attendance
            </h1>

            <p className="mt-3 text-sm text-gray-500">
              No classes available.
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Add a class first from the
              Classes page.
            </p>

          </div>

        </div>
      </div>
    );
  }

  /* ===================================================
     RENDER
     =================================================== */

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
            ================================================= */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h1 className="text-3xl font-bold text-gray-900">
              Attendance
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage and track student attendance.
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <button
              onClick={markAllPresent}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
            >
              Mark All Present
            </button>

            <button
              onClick={markAllAbsent}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Mark All Absent
            </button>

          </div>

        </div>

        {/* =================================================
            VIEW MODES
            ================================================= */}

        <div className="mb-6">

          <div className="mb-3">

            <h2 className="text-lg font-semibold text-gray-900">
              Attendance Period
            </h2>

            <p className="text-sm text-gray-500">
              Choose how you want to view attendance.
            </p>

          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

            {VIEW_MODES.map(
              (mode) => (

                <button
                  key={mode}
                  onClick={() =>
                    setViewMode(mode)
                  }
                  className={`rounded-xl border px-5 py-4 text-left transition ${
                    viewMode === mode
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >

                  <div className="text-base font-semibold">
                    {mode}
                  </div>

                  <div
                    className={`mt-1 text-xs ${
                      viewMode === mode
                        ? 'text-blue-100'
                        : 'text-gray-400'
                    }`}
                  >

                    {mode ===
                      'Daily' &&
                      'View one day'}

                    {mode ===
                      'Weekly' &&
                      'View one week'}

                    {mode ===
                      'Monthly' &&
                      'View one month'}

                    {mode ===
                      'Term' &&
                      'View one term'}

                  </div>

                </button>

              )
            )}

          </div>

        </div>

        {/* =================================================
            FILTERS
            ================================================= */}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="grid gap-4 md:grid-cols-3">

            {/* DATE */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Date
              </label>

              <input
                type="date"
                value={
                  selectedDate
                }
                onChange={(event) =>
                  setSelectedDate(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* CLASS */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Class
              </label>

              <select
                value={
                  selectedClassId
                }
                onChange={(event) =>
                  setSelectedClassId(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >

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
                      {
                        classRoom.name
                      }
                    </option>

                  )
                )}

              </select>

            </div>

            {/* SEARCH */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search Student
              </label>

              <input
                type="text"
                placeholder="Search by name or ID..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

          </div>

          {/* TERM */}

          {viewMode ===
            'Term' && (

            <div className="mt-4 max-w-md">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Term
              </label>

              <select
                value={
                  selectedTerm
                }
                onChange={(event) =>
                  setSelectedTerm(
                    event.target
                      .value as Term
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >

                <option value="First Term">
                  First Term
                </option>

                <option value="Second Term">
                  Second Term
                </option>

              </select>

            </div>

          )}

        </div>

        {/* =================================================
            PERIOD INFO
            ================================================= */}

        <div className="mb-6 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">

          <span className="font-semibold">
            {viewMode}
          </span>

          {' · '}

          {
            selectedClass?.name ??
            'No class'
          }

          {' · '}

          {getPeriodLabel(
            viewMode,
            selectedDate,
            selectedTerm
          )}

        </div>

        {/* =================================================
            STATISTICS
            ================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Students
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {statistics.total}
            </p>

          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Present
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {statistics.present}
            </p>

          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Late
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {statistics.late}
            </p>

          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Absent
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {statistics.absent}
            </p>

          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Attendance Rate
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {statistics.attendanceRate}%
            </p>

          </div>

        </div>

        {/* =================================================
            TABLE
            ================================================= */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-5 py-4">

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

              <div>

                <h2 className="text-lg font-semibold text-gray-900">
                  Attendance Records
                </h2>

                <p className="text-sm text-gray-500">
                  {
                    selectedClass?.name
                  }

                  {' · '}

                  {viewMode}

                  {' · '}

                  {getPeriodLabel(
                    viewMode,
                    selectedDate,
                    selectedTerm
                  )}

                </p>

              </div>

              <div className="text-sm text-gray-500">

                Marked:{' '}

                <span className="font-semibold text-blue-600">
                  {
                    statistics.marked
                  }
                </span>

              </div>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    #
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Student
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Class
                  </th>

                  {viewMode ===
                  'Daily' ? (
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                  ) : (
                    <>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-green-600">
                        Present
                      </th>

                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-yellow-600">
                        Late
                      </th>

                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-red-600">
                        Absent
                      </th>

                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-blue-600">
                        Rate
                      </th>
                    </>
                  )}

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredStudents.map(
                  (
                    student,
                    index
                  ) => {

                    const dailyStatus =
                      getStudentDailyStatus(
                        student.id
                      );

                    const summary =
                      getStudentAttendanceSummary(
                        student.id
                      );

                    return (

                      <tr
                        key={
                          student.id
                        }
                        className="transition hover:bg-gray-50"
                      >

                        <td className="px-5 py-4 text-sm text-gray-500">
                          {index + 1}
                        </td>

                        <td className="px-5 py-4">

                          <div className="font-medium text-gray-900">
                            {
                              student.name
                            }
                          </div>

                          {student.nameAr && (
                            <div
                              className="text-xs text-gray-400"
                              dir="rtl"
                            >
                              {
                                student.nameAr
                              }
                            </div>
                          )}

                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {
                            selectedClass?.name
                          }
                        </td>

                        {/* DAILY */}

                        {viewMode ===
                        'Daily' ? (

                          <td className="px-5 py-4">

                            {dailyStatus ? (

                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                                  dailyStatus
                                )}`}
                              >
                                {
                                  dailyStatus
                                }
                              </span>

                            ) : (

                              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                                Not marked
                              </span>

                            )}

                          </td>

                        ) : (

                          /* WEEKLY / MONTHLY / TERM */

                          <>
                            <td className="px-5 py-4 text-center">

                              <span className="font-semibold text-green-700">
                                {
                                  summary.present
                                }
                              </span>

                            </td>

                            <td className="px-5 py-4 text-center">

                              <span className="font-semibold text-yellow-700">
                                {
                                  summary.late
                                }
                              </span>

                            </td>

                            <td className="px-5 py-4 text-center">

                              <span className="font-semibold text-red-700">
                                {
                                  summary.absent
                                }
                              </span>

                            </td>

                            <td className="px-5 py-4 text-center">

                              {summary.marked >
                              0 ? (

                                <span className="font-semibold text-blue-700">
                                  {
                                    summary.attendanceRate
                                  }
                                  %
                                </span>

                              ) : (

                                <span className="text-gray-400">
                                  -
                                </span>

                              )}

                            </td>
                          </>

                        )}

                        {/* ACTION */}

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            {ATTENDANCE_STATUSES.map(
                              (
                                attendanceStatus
                              ) => (

                                <button
                                  key={
                                    attendanceStatus
                                  }
                                  onClick={() =>
                                    updateAttendance(
                                      student.id,
                                      attendanceStatus
                                    )
                                  }
                                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                                    attendanceStatus ===
                                    'Present'
                                      ? dailyStatus ===
                                        'Present'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                                      : attendanceStatus ===
                                        'Late'
                                      ? dailyStatus ===
                                        'Late'
                                        ? 'bg-yellow-500 text-white'
                                        : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                      : dailyStatus ===
                                        'Absent'
                                      ? 'bg-red-600 text-white'
                                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                                  }`}
                                >
                                  {
                                    attendanceStatus
                                  }
                                </button>

                              )
                            )}

                          </div>

                        </td>

                      </tr>

                    );
                  }
                )}

                {filteredStudents.length ===
                  0 && (

                  <tr>

                    <td
                      colSpan={
                        viewMode ===
                        'Daily'
                          ? 5
                          : 8
                      }
                      className="px-5 py-12 text-center text-sm text-gray-500"
                    >

                      {classStudents.length ===
                      0
                        ? 'No students in this class.'
                        : 'No students found.'}

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}