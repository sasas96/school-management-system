import { useMemo, useState } from 'react';
import { useData } from '@/store/DataContext';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type ReportPeriod = 'week' | 'month' | 'term';

interface StudentAttendanceSummary {
  id: string;
  name: string;
  present: number;
  late: number;
  absent: number;
  records: Record<string, string>;
}

export function AttendanceReportsPage() {
  const { data } = useData();

  const [classId, setClassId] = useState(data.classes[0]?.id ?? '');
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const classes = data.classes ?? [];
  const students = data.students ?? [];
  const attendance = data.attendance ?? [];

  const selectedClass = classes.find((item) => item.id === classId);
  const className = selectedClass?.name ?? '—';

  const classStudents = useMemo(() => {
    return students.filter((student) => student.classId === classId);
  }, [students, classId]);

  const reportDates = useMemo(() => {
    if (!date) return [];

    const selected = new Date(`${date}T00:00:00`);

    if (period === 'week') {
      const day = selected.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;

      const monday = new Date(selected);
      monday.setDate(selected.getDate() + mondayOffset);

      return Array.from({ length: 7 }, (_, i) => {
        const current = new Date(monday);
        current.setDate(monday.getDate() + i);
        return toISODate(current);
      });
    }

    if (period === 'month') {
      const year = selected.getFullYear();
      const month = selected.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      return Array.from({ length: daysInMonth }, (_, i) =>
        toISODate(new Date(year, month, i + 1))
      );
    }

    const dates = new Set<string>();

    for (const record of attendance) {
      if (record.classId === classId) {
        dates.add(record.date);
      }
    }

    return Array.from(dates).sort();
  }, [date, period, attendance, classId]);

  const getStatus = (studentId: string, attendanceDate: string) => {
    const record = attendance.find(
      (item) =>
        item.studentId === studentId &&
        item.classId === classId &&
        item.date === attendanceDate
    );

    return record?.status ?? null;
  };

  const summaries = useMemo<StudentAttendanceSummary[]>(() => {
    return classStudents.map((student) => {
      let present = 0;
      let late = 0;
      let absent = 0;

      const records: Record<string, string> = {};

      for (const reportDate of reportDates) {
        const status = getStatus(student.id, reportDate);

        records[reportDate] = status ?? '';

        if (status === 'Present') present++;
        if (status === 'Late') late++;
        if (status === 'Absent') absent++;
      }

      return {
        id: student.id,
        name: student.name,
        present,
        late,
        absent,
        records,
      };
    });
  }, [classStudents, reportDates, attendance, classId]);

  const totals = useMemo(() => {
    return summaries.reduce(
      (total, summary) => ({
        present: total.present + summary.present,
        late: total.late + summary.late,
        absent: total.absent + summary.absent,
      }),
      { present: 0, late: 0, absent: 0 }
    );
  }, [summaries]);

  const changePeriod = (direction: number) => {
    const current = new Date(`${date}T00:00:00`);

    if (period === 'week') {
      current.setDate(current.getDate() + direction * 7);
    } else if (period === 'month') {
      current.setMonth(current.getMonth() + direction);
    } else {
      current.setMonth(current.getMonth() + direction * 3);
    }

    setDate(toISODate(current));
  };

  const periodLabel = useMemo(() => {
    const selected = new Date(`${date}T00:00:00`);

    if (period === 'week') {
      const day = selected.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;

      const monday = new Date(selected);
      monday.setDate(selected.getDate() + mondayOffset);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return `${formatShortDate(toISODate(monday))} - ${formatShortDate(
        toISODate(sunday)
      )}`;
    }

    if (period === 'month') {
      return selected.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      });
    }

    return 'Term Attendance';
  }, [date, period]);

  const statusClass = (status: string | null) => {
    if (status === 'Present') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (status === 'Late') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    if (status === 'Absent') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    return 'bg-slate-50 text-slate-300 border-slate-100';
  };

  const statusShort = (status: string | null) => {
    if (status === 'Present') return '✓';
    if (status === 'Late') return 'L';
    if (status === 'Absent') return 'A';
    return '—';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Attendance Reports
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review student attendance by week, month, or term.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CalendarDays size={17} />
          {periodLabel}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Class
            </span>

            <select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="form-select min-w-[180px]"
            >
              <option value="">Select class...</option>

              {classes.map((classRoom) => (
                <option key={classRoom.id} value={classRoom.id}>
                  {classRoom.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Period
            </span>

            <select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as ReportPeriod)
              }
              className="form-select min-w-[130px]"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="term">Term</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Reference Date
            </span>

            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="form-input"
            />
          </label>

          <div className="flex items-center gap-1">
            <button
              onClick={() => changePeriod(-1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              title="Previous period"
            >
              <ChevronLeft size={17} />
            </button>

            <button
              onClick={() => changePeriod(1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              title="Next period"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {classes.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Add a class first to generate an attendance report.
        </div>
      )}

      {classId && classStudents.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          The class <strong>{className}</strong> has no students yet.
        </div>
      )}

      {classStudents.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Present"
            value={totals.present}
            className="border-emerald-100 bg-emerald-50 text-emerald-700"
          />

          <SummaryCard
            label="Late"
            value={totals.late}
            className="border-amber-100 bg-amber-50 text-amber-700"
          />

          <SummaryCard
            label="Absent"
            value={totals.absent}
            className="border-rose-100 bg-rose-50 text-rose-700"
          />
        </div>
      )}

      {classStudents.length > 0 && reportDates.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-800">
                  {className}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {periodLabel}
                </p>
              </div>

              <div className="text-xs text-slate-500">
                {classStudents.length} students
              </div>
            </div>
          </div>

          <table className="w-full min-w-max text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-slate-500">
                  Student
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-700">
                  Present
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold text-amber-700">
                  Late
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold text-rose-700">
                  Absent
                </th>

                {reportDates.map((reportDate) => (
                  <th
                    key={reportDate}
                    className="px-3 py-3 text-center text-xs font-semibold text-slate-500"
                  >
                    {formatShortDate(reportDate)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {summaries.map((summary) => (
                <tr key={summary.id} className="hover:bg-slate-50/60">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3">
                    <div className="font-medium text-slate-700">
                      {summary.name}
                    </div>

                    <div className="mt-0.5 text-xs text-slate-400">
                      {summary.id}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center font-semibold text-emerald-700">
                    {summary.present}
                  </td>

                  <td className="px-4 py-3 text-center font-semibold text-amber-700">
                    {summary.late}
                  </td>

                  <td className="px-4 py-3 text-center font-semibold text-rose-700">
                    {summary.absent}
                  </td>

                  {reportDates.map((reportDate) => {
                    const status = summary.records[reportDate] || null;

                    return (
                      <td
                        key={reportDate}
                        className="px-3 py-3 text-center"
                      >
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-xs font-semibold ${statusClass(
                            status
                          )}`}
                          title={status ?? 'No record'}
                        >
                          {statusShort(status)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-wrap gap-5 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            <span>✓ Present</span>
            <span>L Late</span>
            <span>A Absent</span>
            <span>— No record</span>
          </div>
        </div>
      )}

      {classId &&
        classStudents.length > 0 &&
        reportDates.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
            No attendance records found for this period.
          </div>
        )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${className}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>

      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatShortDate(value: string) {
  const parts = value.split('-');

  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}/${parts[1]}`;
}