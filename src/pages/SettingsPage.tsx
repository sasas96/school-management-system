import { useState } from 'react';

import { useData } from '@/store/DataContext';

import {
  Save,
  School,
  User,
} from 'lucide-react';

/*
 * =====================================================
 * SETTINGS PAGE
 * =====================================================
 */

export function SettingsPage() {
  const { data, setData } = useData();

  /*
   * ===================================================
   * STATE
   * ===================================================
   */

  const [schoolName, setSchoolName] =
    useState(data.schoolName ?? '');

  const [teacherName, setTeacherName] =
    useState(data.teacherName ?? '');

  const [saved, setSaved] =
    useState(false);

  /*
   * ===================================================
   * SAVE SETTINGS
   * ===================================================
   */

  const saveSettings = () => {
    setData((currentData) => ({
      ...currentData,

      schoolName:
        schoolName.trim(),

      teacherName:
        teacherName.trim(),
    }));

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  /*
   * ===================================================
   * RENDER
   * ===================================================
   */

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Settings
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your school and teacher information.
        </p>
      </div>

      {/* =================================================
          SCHOOL INFORMATION
      ================================================= */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-5 flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
            <School size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-800">
              School Information
            </h2>

            <p className="text-sm text-slate-500">
              This information will appear on your reports and PDFs.
            </p>
          </div>

        </div>

        <div className="grid gap-4 md:grid-cols-2">

          {/* SCHOOL NAME */}

          <label className="block">

            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              School Name
            </span>

            <input
              type="text"
              value={schoolName}
              onChange={(event) => {
                setSchoolName(
                  event.target.value
                );

                setSaved(false);
              }}
              placeholder="e.g. Omar Ibn El-Khattab Middle School"
              className="form-input w-full"
            />

          </label>

          {/* TEACHER NAME */}

          <label className="block">

            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Teacher Name
            </span>

            <input
              type="text"
              value={teacherName}
              onChange={(event) => {
                setTeacherName(
                  event.target.value
                );

                setSaved(false);
              }}
              placeholder="e.g. Ossama Lachgar"
              className="form-input w-full"
            />

          </label>

        </div>

      </div>

      {/* =================================================
          PREVIEW
      ================================================= */}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

        <h2 className="mb-4 text-sm font-semibold text-slate-700">
          Report Preview
        </h2>

        <div className="rounded-lg border border-slate-200 bg-white p-5">

          <div className="text-center">

            <h3 className="text-xl font-bold text-slate-800">
              كشف نقط المراقبة المستمرة
            </h3>

          </div>

          <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">

            <div>
              <span className="font-medium text-slate-500">
                المؤسسة :
              </span>{' '}

              <span className="text-slate-800">
                {schoolName ||
                  'School Name'}
              </span>
            </div>

            <div>
              <span className="font-medium text-slate-500">
                الأستاذ :
              </span>{' '}

              <span className="text-slate-800">
                {teacherName ||
                  'Teacher Name'}
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          SAVE
      ================================================= */}

      <div className="flex items-center gap-3">

        <button
          type="button"
          onClick={saveSettings}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
        >
          <Save size={17} />

          Save Settings
        </button>

        {saved && (
          <span className="text-sm font-medium text-emerald-600">
            Settings saved successfully.
          </span>
        )}

      </div>

    </div>
  );
}