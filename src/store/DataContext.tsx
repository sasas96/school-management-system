import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { AppData } from '@/types';
import { loadData, saveData } from '@/lib/storage';
import { demoData } from '@/lib/seed';

interface DataContextValue {
  data: AppData;

  setData: React.Dispatch<
    React.SetStateAction<AppData>
  >;

  importData: (incoming: AppData) => void;

  resetToDemo: () => void;

  clearAll: () => void;

  deleteStudent: (studentId: string) => void;
}

const DataContext =
  createContext<DataContextValue | null>(null);

export function DataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<AppData>(() => {
    return loadData();
  });

  /*
   * =====================================================
   * SAVE DATA
   * =====================================================
   */

  useEffect(() => {
    saveData(data);
  }, [data]);

  /*
   * =====================================================
   * DELETE STUDENT
   * =====================================================
   */

  const deleteStudent = (studentId: string) => {
    setData((currentData) => {
      return {
        ...currentData,

        students: currentData.students.filter(
          (student) => student.id !== studentId
        ),

        attendance: currentData.attendance.filter(
          (record) => record.studentId !== studentId
        ),

        assessments: currentData.assessments.filter(
          (assessment) =>
            assessment.studentId !== studentId
        ),

        integratedActivities:
          currentData.integratedActivities?.filter(
            (activity) =>
              activity.studentId !== studentId
          ) ?? [],
      };
    });
  };

  /*
   * =====================================================
   * CONTEXT VALUE
   * =====================================================
   */

  const value = useMemo<DataContextValue>(
    () => ({
      data,

      setData,

      importData: (incoming) => {
        setData(incoming);
      },

      /*
       * Restore demo data manually
       */

      resetToDemo: () => {
        setData(demoData());
      },

      /*
       * Completely clear all application data
       */

      clearAll: () => {
        setData({
          classes: [],
          students: [],
          attendance: [],
          assessments: [],
          integratedActivities: [],
        });
      },

      deleteStudent,
    }),
    [data]
  );

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);

  if (!ctx) {
    throw new Error(
      'useData must be used within DataProvider'
    );
  }

  return ctx;
}