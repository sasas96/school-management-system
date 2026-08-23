import { useMemo, useState } from 'react';
import { useData } from '@/store/DataContext';
import type { AttendanceStatus } from '@/types';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Printer,
} from 'lucide-react';

type PeriodType = 'week' | 'month' | 'term' | 'custom';

type DateRange = {
  start: string;
  end: string;
};

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  Present: 'P',
  Late: 'L',
  Absent: 'A',
};

const STATUS_TITLE: Record<AttendanceStatus, string> = {
  Present: 'Present',
  Late: 'Late',
  Absent: 'Absent',
};

function formatDate(value: string) {
  if (!value) return '—';

  const parts = value.split('-');

  if (parts.length !== 3) {
    return value;
  }

  const [year, month, day] = parts;

  return `${day}-${month}-${year}`;
}

function formatDayName(value: string) {
  const date = new Date(`${value}T00:00:00`);

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
  });
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
  });
}

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');
  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();

  const diff =
    day === 0 ? -6 : 1 - day;

  result.setDate(
    result.getDate() + diff
  );

  return result;
}

function endOfWeek(date: Date) {
  const result = startOfWeek(date);

  result.setDate(
    result.getDate() + 6
  );

  return result;
}

function startOfMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

function endOfMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  );
}

/*
 * Academic term:
 *
 * First Term  = September 1 -> January 31
 * Second Term = February 1 -> June 30
 *
 * This is intentionally kept simple because
 * attendance records do not contain a term field.
 */
function getTermRange(
  academicYear: string,
  term: 'first' | 'second'
): DateRange {
  const match =
    academicYear.match(/^(\d{4})/);

  const startYear = match
    ? Number(match[1])
    : new Date().getFullYear();

  if (term === 'first') {
    return {
      start: `${startYear}-09-01`,
      end: `${startYear + 1}-01-31`,
    };
  }

  return {
    start: `${startYear + 1}-02-01`,
    end: `${startYear + 1}-06-30`,
  };
}

function getDateRange(
  period: PeriodType,
  referenceDate: string,
  academicYear: string,
  customStart: string,
  customEnd: string
): DateRange {
  const reference = new Date(
    `${referenceDate}T00:00:00`
  );

  if (period === 'week') {
    return {
      start: toDateString(
        startOfWeek(reference)
      ),
      end: toDateString(
        endOfWeek(reference)
      ),
    };
  }

  if (period === 'month') {
    return {
      start: toDateString(
        startOfMonth(reference)
      ),
      end: toDateString(
        endOfMonth(reference)
      ),
    };
  }

  if (period === 'term') {
    const month =
      reference.getMonth() + 1;

    if (month >= 9) {
      return getTermRange(
        academicYear,
        'first'
      );
    }

    if (month <= 1) {
      return getTermRange(
        academicYear,
        'first'
      );
    }

    return getTermRange(
      academicYear,
      'second'
    );
  }

  return {
    start: customStart,
    end: customEnd,
  };
}

function generateDates(
  start: string,
  end: string
) {
  if (!start || !end) {
    return [];
  }

  const dates: string[] = [];

  const current = new Date(
    `${start}T00:00:00`
  );

  const last = new Date(
    `${end}T00:00:00`
  );

  while (current <= last) {
    dates.push(
      toDateString(current)
    );

    current.setDate(
      current.getDate() + 1
    );
  }

  return dates;
}

function statusClass(
  status?: AttendanceStatus
) {
  if (status === 'Present') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  if (status === 'Late') {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  if (status === 'Absent') {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return 'bg-slate-50 text-slate-400 border-slate-200';
}

export function AttendanceReportPage() {
  const { data } = useData();

  const [classId, setClassId] =
    useState(
      data.classes[0]?.id ?? ''
    );

  const [period, setPeriod] =
    useState<PeriodType>('month');

  const [referenceDate, setReferenceDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

  const [customStart, setCustomStart] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

  const [customEnd, setCustomEnd] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

  const selectedClass =
    data.classes.find(
      (c) => c.id === classId
    );

  const classStudents = useMemo(
    () =>
      data.students
        .filter(
          (student) =>
            student.classId === classId
        )
        .sort((a, b) =>
          a.name.localeCompare(
            b.name
          )
        ),
    [data.students, classId]
  );

  const dateRange = useMemo(
    () =>
      getDateRange(
        period,
        referenceDate,
        selectedClass
          ?.academicYear ?? '',
        customStart,
        customEnd
      ),
    [
      period,
      referenceDate,
      selectedClass,
      customStart,
      customEnd,
    ]
  );

  const dates = useMemo(
    () =>
      generateDates(
        dateRange.start,
        dateRange.end
      ),
    [dateRange]
  );

  /*
   * Attendance lookup:
   *
   * studentId + date
   *
   * This avoids repeatedly searching
   * the complete attendance array.
   */
  const attendanceMap = useMemo(() => {
    const map = new Map<
      string,
      AttendanceStatus
    >();

    for (const record of data.attendance) {
      if (
        record.classId !== classId
      ) {
        continue;
      }

      if (
        record.date <
          dateRange.start ||
        record.date >
          dateRange.end
      ) {
        continue;
      }

      map.set(
        `${record.studentId}_${record.date}`,
        record.status
      );
    }

    return map;
  }, [
    data.attendance,
    classId,
    dateRange,
  ]);

  const studentStats = useMemo(() => {
    return classStudents.map(
      (student) => {
        let present = 0;
        let late = 0;
        let absent = 0;

        for (const date of dates) {
          const status =
            attendanceMap.get(
              `${student.id}_${date}`
            );

          if (status === 'Present') {
            present++;
          }

          if (status === 'Late') {
            late++;
          }

          if (status === 'Absent') {
            absent++;
          }
        }

        return {
          student,
          present,
          late,
          absent,
          totalRecorded:
            present +
            late +
            absent,
        };
      }
    );
  }, [
    classStudents,
    dates,
    attendanceMap,
  ]);

  const totals = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;

    for (const item of studentStats) {
      present += item.present;
      late += item.late;
      absent += item.absent;
    }

    return {
      present,
      late,
      absent,
      recorded:
        present +
        late +
        absent,
    };
  }, [studentStats]);

  const goPrevious = () => {
    const current = new Date(
      `${referenceDate}T00:00:00`
    );

    if (period === 'week') {
      current.setDate(
        current.getDate() - 7
      );
    }

    if (period === 'month') {
      current.setMonth(
        current.getMonth() - 1
      );
    }

    if (period === 'term') {
      current.setMonth(
        current.getMonth() - 6
      );
    }

    setReferenceDate(
      toDateString(current)
    );
  };

  const goNext = () => {
    const current = new Date(
      `${referenceDate}T00:00:00`
    );

    if (period === 'week') {
      current.setDate(
        current.getDate() + 7
      );
    }

    if (period === 'month') {
      current.setMonth(
        current.getMonth() + 1
      );
    }

    if (period === 'term') {
      current.setMonth(
        current.getMonth() + 6
      );
    }

    setReferenceDate(
      toDateString(current)
    );
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* ================================================= */}
      {/* PAGE HEADER */}
      {/* ================================================= */}

      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Attendance Report
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review attendance by week,
            month, or term.
          </p>
        </div>

        <button
          onClick={printReport}
          disabled={
            classStudents.length === 0
          }
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Printer size={16} />
          Print Report
        </button>
      </div>

      {/* ================================================= */}
      {/* FILTER PANEL */}
      {/* ================================================= */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          {/* CLASS */}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Class
            </span>

            <select
              value={classId}
              onChange={(event) =>
                setClassId(
                  event.target.value
                )
              }
              className="form-select min-w-[180px]"
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
          </label>

          {/* PERIOD */}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Period
            </span>

            <select
              value={period}
              onChange={(event) =>
                setPeriod(
                  event.target
                    .value as PeriodType
                )
              }
              className="form-select min-w-[150px]"
            >
              <option value="week">
                Week
              </option>

              <option value="month">
                Month
              </option>

              <option value="term">
                Term
              </option>

              <option value="custom">
                Custom
              </option>
            </select>
          </label>

          {/* REFERENCE DATE */}

          {period !== 'custom' && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Reference Date
              </span>

              <input
                type="date"
                value={
                  referenceDate
                }
                onChange={(event) =>
                  setReferenceDate(
                    event.target
                      .value
                  )
                }
                className="form-input"
              />
            </label>
          )}

          {/* CUSTOM */}

          {period === 'custom' && (
            <>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  From
                </span>

                <input
                  type="date"
                  value={
                    customStart
                  }
                  onChange={(event) =>
                    setCustomStart(
                      event.target
                        .value
                    )
                  }
                  className="form-input"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  To
                </span>

                <input
                  type="date"
                  value={
                    customEnd
                  }
                  onChange={(event) =>
                    setCustomEnd(
                      event.target
                        .value
                    )
                  }
                  className="form-input"
                />
              </label>
            </>
          )}

          {/* NAVIGATION */}

          {period !== 'custom' && (
            <div className="flex gap-1">
              <button
                onClick={goPrevious}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                title="Previous"
              >
                <ChevronLeft
                  size={18}
                />
              </button>

              <button
                onClick={goNext}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                title="Next"
              >
                <ChevronRight
                  size={18}
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================================================= */}
      {/* REPORT */}
      {/* ================================================= */}

      {classStudents.length > 0 ? (
        <div
          id="attendance-report"
          className="rounded-xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none"
        >
          {/* REPORT HEADER */}

          <div className="border-b border-slate-200 p-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-800">
                Attendance Report
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {selectedClass?.name ??
                  '—'}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-400">
                  Class
                </div>

                <div className="mt-1 font-semibold text-slate-700">
                  {selectedClass?.name ??
                    '—'}
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-400">
                  Period
                </div>

                <div className="mt-1 font-semibold text-slate-700">
                  {formatDate(
                    dateRange.start
                  )}{' '}
                  →{' '}
                  {formatDate(
                    dateRange.end
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-400">
                  Academic Year
                </div>

                <div className="mt-1 font-semibold text-slate-700">
                  {selectedClass
                    ?.academicYear ??
                    '—'}
                </div>
              </div>
            </div>
          </div>

          {/* LEGEND */}

          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-5 py-3 text-xs">
            <span className="font-medium text-slate-500">
              Legend:
            </span>

            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
              P = Present
            </span>

            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 font-semibold text-amber-700">
              L = Late
            </span>

            <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 font-semibold text-rose-700">
              A = Absent
            </span>

            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-semibold text-slate-400">
              — = Not recorded
            </span>
          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50">
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-10 min-w-[55px] border border-slate-200 px-2 py-2 text-center font-semibold text-slate-600"
                  >
                    #
                  </th>

                  <th
                    rowSpan={2}
                    className="sticky left-[55px] z-10 min-w-[105px] border border-slate-200 px-3 py-2 text-left font-semibold text-slate-600"
                  >
                    Student ID
                  </th>

                  <th
                    rowSpan={2}
                    className="sticky left-[160px] z-10 min-w-[180px] border border-slate-200 px-3 py-2 text-left font-semibold text-slate-600"
                  >
                    Student
                  </th>

                  {dates.map(
                    (date) => (
                      <th
                        key={date}
                        className="min-w-[58px] border border-slate-200 px-1 py-2 text-center font-semibold text-slate-600"
                      >
                        <div>
                          {formatDayName(
                            date
                          )}
                        </div>

                        <div className="mt-0.5 text-[10px] font-normal text-slate-400">
                          {formatShortDate(
                            date
                          )}
                        </div>
                      </th>
                    )
                  )}

                  <th
                    rowSpan={2}
                    className="min-w-[70px] border border-slate-200 px-2 py-2 text-center font-semibold text-emerald-700"
                  >
                    Present
                  </th>

                  <th
                    rowSpan={2}
                    className="min-w-[60px] border border-slate-200 px-2 py-2 text-center font-semibold text-amber-700"
                  >
                    Late
                  </th>

                  <th
                    rowSpan={2}
                    className="min-w-[65px] border border-slate-200 px-2 py-2 text-center font-semibold text-rose-700"
                  >
                    Absent
                  </th>
                </tr>

                <tr className="bg-slate-50">
                  {dates.map(
                    (date) => (
                      <th
                        key={`${date}-sub`}
                        className="border border-slate-200 px-1 py-1 text-center text-[9px] font-normal text-slate-400"
                      >
                        {date}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {studentStats.map(
                  (
                    item,
                    index
                  ) => (
                    <tr
                      key={
                        item.student.id
                      }
                      className="hover:bg-slate-50"
                    >
                      <td className="sticky left-0 z-10 border border-slate-200 bg-white px-2 py-2 text-center font-medium text-slate-500">
                        {index + 1}
                      </td>

                      <td className="sticky left-[55px] z-10 border border-slate-200 bg-white px-2 py-2 font-medium text-slate-600">
                        {item.student.id}
                      </td>

                      <td className="sticky left-[160px] z-10 border border-slate-200 bg-white px-3 py-2">
                        <div className="font-medium text-slate-700">
                          {item.student.name}
                        </div>

                        {item.student.nameAr && (
                          <div
                            dir="rtl"
                            className="mt-0.5 text-[11px] text-slate-400"
                          >
                            {
                              item
                                .student
                                .nameAr
                            }
                          </div>
                        )}
                      </td>

                      {dates.map(
                        (date) => {
                          const status =
                            attendanceMap.get(
                              `${item.student.id}_${date}`
                            );

                          return (
                            <td
                              key={`${item.student.id}-${date}`}
                              className="border border-slate-200 px-1 py-1 text-center"
                            >
                              <span
                                title={
                                  status
                                    ? STATUS_TITLE[
                                        status
                                      ]
                                    : 'Not recorded'
                                }
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-md border font-bold ${statusClass(
                                  status
                                )}`}
                              >
                                {status
                                  ? STATUS_LABEL[
                                      status
                                    ]
                                  : '—'}
                              </span>
                            </td>
                          );
                        }
                      )}

                      <td className="border border-slate-200 bg-emerald-50/30 px-2 py-2 text-center font-semibold text-emerald-700">
                        {item.present}
                      </td>

                      <td className="border border-slate-200 bg-amber-50/30 px-2 py-2 text-center font-semibold text-amber-700">
                        {item.late}
                      </td>

                      <td className="border border-slate-200 bg-rose-50/30 px-2 py-2 text-center font-semibold text-rose-700">
                        {item.absent}
                      </td>
                    </tr>
                  )
                )}
              </tbody>

              {/* TOTAL ROW */}

              <tfoot>
                <tr className="bg-slate-50 font-semibold">
                  <td
                    colSpan={3}
                    className="border border-slate-200 px-3 py-3 text-right text-slate-600"
                  >
                    Class Total
                  </td>

                  {dates.map(
                    (date) => {
                      let present = 0;
                      let late = 0;
                      let absent = 0;

                      for (const student of classStudents) {
                        const status =
                          attendanceMap.get(
                            `${student.id}_${date}`
                          );

                        if (
                          status ===
                          'Present'
                        ) {
                          present++;
                        }

                        if (
                          status ===
                          'Late'
                        ) {
                          late++;
                        }

                        if (
                          status ===
                          'Absent'
                        ) {
                          absent++;
                        }
                      }

                      return (
                        <td
                          key={`total-${date}`}
                          className="border border-slate-200 px-1 py-2 text-center"
                          title={`Present: ${present}, Late: ${late}, Absent: ${absent}`}
                        >
                          <span className="text-slate-500">
                            {present +
                              late +
                              absent}
                          </span>
                        </td>
                      );
                    }
                  )}

                  <td className="border border-slate-200 bg-emerald-50 px-2 py-2 text-center text-emerald-700">
                    {totals.present}
                  </td>

                  <td className="border border-slate-200 bg-amber-50 px-2 py-2 text-center text-amber-700">
                    {totals.late}
                  </td>

                  <td className="border border-slate-200 bg-rose-50 px-2 py-2 text-center text-rose-700">
                    {totals.absent}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* FOOTER */}

          <div className="border-t border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <CalendarDays
                  size={14}
                />

                <span>
                  {dates.length} calendar
                  days in this period
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                <span>
                  Recorded:{' '}
                  <strong className="text-slate-700">
                    {totals.recorded}
                  </strong>
                </span>

                <span>
                  Present:{' '}
                  <strong className="text-emerald-700">
                    {totals.present}
                  </strong>
                </span>

                <span>
                  Late:{' '}
                  <strong className="text-amber-700">
                    {totals.late}
                  </strong>
                </span>

                <span>
                  Absent:{' '}
                  <strong className="text-rose-700">
                    {totals.absent}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <CalendarDays
            size={36}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-3 font-semibold text-slate-700">
            No students found
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Select a class that contains
            students to generate the
            attendance report.
          </p>
        </div>
      )}
    </div>
  );
}