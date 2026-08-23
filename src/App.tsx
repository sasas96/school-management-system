import { useState } from 'react';
import { DataProvider } from '@/store/DataContext';

import { DashboardPage } from '@/pages/DashboardPage';
import { ClassesPage } from '@/pages/ClassesPage';
import { StudentsPage } from '@/pages/StudentsPage';
import { AttendancePage } from '@/pages/AttendancePage';
import { AssessmentsPage } from '@/pages/AssessmentsPage';
import { ReportsPage } from '@/pages/ReportsPage';

import { BackupBar } from '@/components/BackupBar';

import {
  LayoutDashboard,
  School,
  Users,
  CalendarCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

type PageId =
  | 'dashboard'
  | 'classes'
  | 'students'
  | 'attendance'
  | 'assessments'
  | 'reports';

type NavItem = {
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
};

const NAV: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'classes',
    label: 'Classes',
    icon: School,
  },
  {
    id: 'students',
    label: 'Students',
    icon: Users,
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: CalendarCheck,
  },
  {
    id: 'assessments',
    label: 'Assessments',
    icon: ClipboardList,
  },
  {
    id: 'reports',
    label: 'Reports & Export',
    icon: FileText,
  },
];

function App() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  function renderPage() {
    switch (page) {
      case 'dashboard':
        return <DashboardPage />;

      case 'classes':
        return <ClassesPage />;

      case 'students':
        return <StudentsPage />;

      case 'attendance':
        return <AttendancePage />;

      case 'assessments':
        return <AssessmentsPage />;

      case 'reports':
        return <ReportsPage />;

      default:
        return <DashboardPage />;
    }
  }

  const currentPage =
    NAV.find((item) => item.id === page)?.label ?? 'Dashboard';

  function handleNavigation(id: PageId) {
    setPage(id);
    setMobileOpen(false);
  }

  function SidebarContent() {
    return (
      <div className="flex h-full flex-col bg-white">
        {/* Logo / Brand */}
        <div className="border-b border-slate-100 px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
              <GraduationCap size={23} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold tracking-tight text-slate-900">
                Teacher Manager
              </p>

              <p className="mt-0.5 truncate text-xs text-slate-400">
                Simple Class Control
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Main Menu
          </p>

          <div className="space-y-1">
            {NAV.map((item) => {
              const active = page === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigation(item.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                    active
                      ? 'bg-sky-50 font-semibold text-sky-700'
                      : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sky-600" />
                  )}

                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      active
                        ? 'bg-sky-100 text-sky-600'
                        : 'bg-transparent text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
                    }`}
                  >
                    <Icon size={17} strokeWidth={2} />
                  </span>

                  <span className="truncate">{item.label}</span>

                  {active && (
                    <ChevronRight
                      size={15}
                      className="ml-auto shrink-0 text-sky-500"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Data / Backup */}
        <div className="border-t border-slate-100 bg-slate-50/60 p-4">
          <p className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Data
          </p>

          <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <BackupBar />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="absolute inset-y-0 left-0 w-72 overflow-hidden bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close menu"
            >
              <X size={19} />
            </button>

            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Application */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm">
                  <GraduationCap size={18} />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Teacher Manager
                  </p>

                  <p className="text-[10px] text-slate-400">
                    {currentPage}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Desktop Top Bar */}
        <div className="hidden border-b border-slate-200 bg-white lg:block">
          <div className="flex h-[72px] items-center justify-between px-8">
            <div>
              <p className="text-xs font-medium text-slate-400">
                Teacher Manager
              </p>

              <h1 className="mt-0.5 text-lg font-bold text-slate-900">
                {currentPage}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500">
                Academic Management
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                T
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-72px)] bg-slate-50">
          <div className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AppWithProvider() {
  return (
    <DataProvider>
      <App />
    </DataProvider>
  );
}