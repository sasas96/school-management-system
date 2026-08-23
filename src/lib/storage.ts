import type { AppData } from '@/types';

const KEY = 'teacher-mgmt-data';

const EMPTY: AppData = {
  classes: [],
  students: [],
  attendance: [],
  assessments: [],
  integratedActivities: [],
};

/*
 * =====================================================
 * LOAD DATA
 * =====================================================
 */

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);

    if (!raw) {
      return structuredClone(EMPTY);
    }

    const parsed = JSON.parse(raw) as Partial<AppData>;

    return {
      classes: parsed.classes ?? [],
      students: parsed.students ?? [],
      attendance: parsed.attendance ?? [],
      assessments: parsed.assessments ?? [],
      integratedActivities:
        parsed.integratedActivities ?? [],
    };
  } catch {
    return structuredClone(EMPTY);
  }
}

/*
 * =====================================================
 * SAVE DATA
 * =====================================================
 */

export function saveData(data: AppData): void {
  localStorage.setItem(
    KEY,
    JSON.stringify(data)
  );
}

/*
 * =====================================================
 * CLEAR DATA
 * =====================================================
 */

export function clearData(): void {
  localStorage.removeItem(KEY);
}

/*
 * =====================================================
 * ID GENERATORS
 * =====================================================
 */

function nextSeq(
  existing: string[],
  pad: number
): number {
  let max = 0;

  for (const id of existing) {
    const m = id.match(/(\d+)\s*$/);

    if (m) {
      max = Math.max(
        max,
        parseInt(m[1], 10)
      );
    }
  }

  return max + 1;
}

export function nextStudentId(
  students: { id: string }[]
): string {
  const n = nextSeq(
    students.map((s) => s.id),
    3
  );

  return (
    'STU' +
    String(n).padStart(3, '0')
  );
}

export function nextAttendanceId(
  records: { id: string }[]
): string {
  const n = nextSeq(
    records.map((r) => r.id),
    4
  );

  return (
    'ATT' +
    String(n).padStart(4, '0')
  );
}

export function nextAssessmentId(
  records: { id: string }[]
): string {
  const n = nextSeq(
    records.map((r) => r.id),
    4
  );

  return (
    'ASM' +
    String(n).padStart(4, '0')
  );
}