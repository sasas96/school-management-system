import type { AppData } from '@/types';

export const EMPTY_DATA: AppData = {
  schoolName: '',
  teacherName: '',
  classes: [],
  students: [],
  attendance: [],
  assessments: [],
  integratedActivities: [],
};

export function loadData(): AppData {
  return structuredClone(EMPTY_DATA);
}

export function saveData(_data: AppData): void {
  // Data is now stored in Supabase.
}

export function clearData(): void {
  // Data is now stored in Supabase.
}

function nextSeq(existing: string[]): number {
  let max = 0;

  for (const id of existing) {
    const match = id.match(/(\d+)\s*$/);

    if (match) {
      max = Math.max(
        max,
        parseInt(match[1], 10)
      );
    }
  }

  return max + 1;
}

export function nextStudentId(
  students: { id: string }[]
): string {
  return (
    'STU' +
    String(
      nextSeq(students.map((s) => s.id))
    ).padStart(3, '0')
  );
}

export function nextAttendanceId(
  records: { id: string }[]
): string {
  return (
    'ATT' +
    String(
      nextSeq(records.map((r) => r.id))
    ).padStart(4, '0')
  );
}

export function nextAssessmentId(
  records: { id: string }[]
): string {
  return (
    'ASM' +
    String(
      nextSeq(records.map((r) => r.id))
    ).padStart(4, '0')
  );
}