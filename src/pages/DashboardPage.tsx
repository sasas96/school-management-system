import { useMemo, useState } from 'react';
import { useData } from '@/store/DataContext';
import { summarizeStudent, fmtPct } from '@/lib/calculations';
import { StatusBadge, ProgressBadge } from '@/components/Badges';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  AlertTriangle,
  ChevronDown,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

export function DashboardPage() {
  const { data } = useData();
  const [classFilter, setClassFilter] = useState('');

  const students = useMemo(
    () =>
      classFilter
        ? data.students.filter((s) => s.classId === classFilter)
        : data.students,
    [data.students, classFilter]
  );

  const summaries = useMemo(
    () =>
      students.map((s) => ({
        student: s,
        summary: summarizeStudent(s, data.attendance, data.assessments),
      })),
    [students, data.attendance, data.assessments]
  );

  const overallAttendanceRate = useMemo(() => {
    if (data.attendance.length === 0) return 0;

    const present = data.attendance.filter(
      (a) => a.status === 'Present'
    ).length;

    const late = data.attendance.filter(
      (a) => a.status === 'Late'
    ).length;

    return ((present + late * 0.5) / data.attendance.length) * 100;
  }, [data.attendance]);

  const attentionCount = summaries.filter(
    (x) => x.summary.status === 'Attention'
  ).length;

  const className = (id: string) =>
    data.classes.find((c) => c.id === id)?.name ?? '—';

  const cards = [
    {
      label: 'Total Classes',
      value: data.classes.length,
      icon: GraduationCap,
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-50',
      accent: 'bg-sky-500',
    },
    {
      label: 'Total Students',
      value: data.students.length,
      icon: Users,
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-50',
      accent: 'bg-violet-500',
    },
    {
      label: 'Attendance Rate',
      value: fmtPct(overallAttendanceRate),
      icon: CalendarCheck,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      accent: 'bg-emerald-500',
    },
    {
      label: 'Need Attention',
      value: attentionCount,
      icon: AlertTriangle,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50',
      accent: 'bg-rose-500',
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* =========================================
          PAGE HEADER
          ========================================= */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-600">
            Overview
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Keep track of your classes, students, attendance and progress.
          </p>
        </div>

        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm sm:flex">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <TrendingUp size={15} />
          </span>

          <span>Academic overview</span>
        </div>
      </div>

      {/* =========================================
          KPI CARDS
          ========================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div
                className={`absolute left-0 top-0 h-1 w-full ${card.accent} opacity-80`}
              />

              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor} transition-transform duration-200 group-hover:scale-105`}
                >
                  <Icon size={21} strokeWidth={2} />
                </div>

                <span className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition-colors group-hover:bg-slate-50 group-hover:text-slate-500">
                  <ArrowUpRight size={16} />
                </span>
              </div>

              <div className="mt-5">
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {card.value}
                </p>

                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {card.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================
          STUDENT OVERVIEW HEADER
          ========================================= */}

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <Users size={17} />
              </div>

              <h2 className="text-base font-bold text-slate-800">
                Student Overview
              </h2>
            </div>

            <p className="mt-1 pl-11 text-xs text-slate-400">
              Monitor attendance, scores and student progress.
            </p>
          </div>

          {/* Class Filter */}

          <div className="relative min-w-[190px]">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="form-select appearance-none cursor-pointer pr-10"
            >
              <option value="">All Classes</option>

              {data.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        {/* =========================================
            TABLE
            ========================================= */}

        <div className="overflow-x-auto">
          <table className="app-table min-w-[760px]">
            <thead>
              <tr>
                <th>Student</th>
                <th>Attendance</th>
                <th>Average Score</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {summaries.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-14">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Users size={21} />
                      </div>

                      <p className="text-sm font-semibold text-slate-600">
                        No students to show
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Try selecting another class.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {summaries.map(({ student, summary }) => (
                <tr key={student.id} className="group">
                  {/* Student */}

                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-bold text-sky-700">
                        {student.name
                          .split(' ')
                          .map((part) => part.charAt(0))
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-700 transition-colors group-hover:text-sky-700">
                          {student.name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {student.id} · {className(student.classId)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Attendance */}

                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">
                        {summary.totalSessions > 0
                          ? fmtPct(summary.attendanceRate)
                          : '-'}
                      </span>

                      {summary.totalSessions > 0 && (
                        <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 sm:block">
                          <div
                            className="h-full rounded-full bg-sky-500"
                            style={{
                              width: `${Math.min(
                                Math.max(summary.attendanceRate, 0),
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Average Score */}

                  <td>
                    <span className="font-semibold text-slate-700">
                      {fmtPct(summary.averageScore)}
                    </span>
                  </td>

                  {/* Progress */}

                  <td>
                    <ProgressBadge progress={summary.progress} />
                  </td>

                  {/* Status */}

                  <td>
                    <StatusBadge status={summary.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* =========================================
            TABLE FOOTER
            ========================================= */}

        {summaries.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
            <p className="text-xs text-slate-400">
              Showing{' '}
              <span className="font-semibold text-slate-600">
                {summaries.length}
              </span>{' '}
              {summaries.length === 1 ? 'student' : 'students'}
            </p>

            {classFilter && (
              <button
                type="button"
                onClick={() => setClassFilter('')}
                className="text-xs font-semibold text-sky-600 transition-colors hover:text-sky-700"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}