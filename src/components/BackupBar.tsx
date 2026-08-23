import { useRef } from 'react';
import { useData } from '@/store/DataContext';
import {
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';
import type { AppData } from '@/types';

export function BackupBar() {
  const {
    data,
    importData,
    resetToDemo,
    clearAll,
  } = useData();

  const fileRef =
    useRef<HTMLInputElement>(null);

  /*
   * =====================================================
   * EXPORT BACKUP
   * =====================================================
   */

  const handleExport = () => {
    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      {
        type: 'application/json',
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement('a');

    a.href = url;

    a.download = `teacher-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    a.click();

    URL.revokeObjectURL(url);
  };

  /*
   * =====================================================
   * IMPORT BACKUP
   * =====================================================
   */

  const handleImportFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {
      try {
        const parsed =
          JSON.parse(
            reader.result as string
          ) as AppData;

        /*
         * Basic validation
         */

        if (
          !parsed.classes ||
          !parsed.students
        ) {
          throw new Error('bad');
        }

        /*
         * Restore ALL application data.
         *
         * integratedActivities is required
         * by AppData and must be included
         * in the backup import.
         */

        importData({
          classes:
            parsed.classes ?? [],

          students:
            parsed.students ?? [],

          attendance:
            parsed.attendance ?? [],

          assessments:
            parsed.assessments ?? [],

          integratedActivities:
            parsed.integratedActivities ?? [],
        });

        alert(
          'Backup imported successfully.'
        );
      } catch {
        alert(
          'Invalid backup file.'
        );
      }
    };

    reader.readAsText(file);

    /*
     * Reset input so the same file can
     * be selected again if necessary.
     */

    e.target.value = '';
  };

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <div className="flex flex-wrap items-center gap-2">

      {/* EXPORT BACKUP */}

      <button
        onClick={handleExport}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <Download size={14} />

        Export Backup
      </button>

      {/* IMPORT BACKUP */}

      <button
        onClick={() =>
          fileRef.current?.click()
        }
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <Upload size={14} />

        Import Backup
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* LOAD DEMO */}

      <button
        onClick={() => {
          if (
            confirm(
              'Reset all data to the demo dataset? This cannot be undone.'
            )
          ) {
            resetToDemo();
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <RotateCcw size={14} />

        Load Demo
      </button>

      {/* CLEAR ALL */}

      <button
        onClick={() => {
          if (
            confirm(
              'Delete ALL data? This cannot be undone.'
            )
          ) {
            clearAll();
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
      >
        Clear All
      </button>

    </div>
  );
}