import type {
  AssessmentRecord,
  AttendanceRecord,
  Progress,
  Status,
  Student,
  StudentSummary,
} from '@/types';

export function getStudentAttendance(records: AttendanceRecord[], studentId: string) {
  const list = records.filter((r) => r.studentId === studentId);
  const present = list.filter((r) => r.status === 'Present').length;
  const late = list.filter((r) => r.status === 'Late').length;
  const absent = list.filter((r) => r.status === 'Absent').length;
  const totalSessions = list.length;
  const attendanceRate =
    totalSessions === 0 ? 0 : ((present + late * 0.5) / totalSessions) * 100;
  const attendanceConcern = totalSessions > 0 && attendanceRate < 80;
  return { present, late, absent, totalSessions, attendanceRate, attendanceConcern };
}

export function getStudentAssessments(records: AssessmentRecord[], studentId: string) {
  return records
    .filter((r) => r.studentId === studentId)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function averagePercentage(records: AssessmentRecord[]): number | null {
  const valid = records.filter((r) => r.maxScore > 0);
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, r) => acc + (r.score / r.maxScore) * 100, 0);
  return sum / valid.length;
}

export function calcProgress(records: AssessmentRecord[]): Progress {
  if (records.length < 2) return 'Not enough data';
  const valid = records.filter((r) => r.maxScore > 0);
  if (valid.length < 2) return 'Not enough data';
  const mid = Math.floor(valid.length / 2);
  const early = averagePercentage(valid.slice(0, mid)) ?? 0;
  const late = averagePercentage(valid.slice(mid)) ?? 0;
  if (late - early > 5) return 'Improving';
  if (early - late > 5) return 'Declining';
  return 'Stable';
}

export function summarizeStudent(
  student: Student,
  attendance: AttendanceRecord[],
  assessments: AssessmentRecord[]
): StudentSummary {
  const att = getStudentAttendance(attendance, student.id);
  const studentAssessments = getStudentAssessments(assessments, student.id);
  const avg = averagePercentage(studentAssessments);
  const progress = calcProgress(studentAssessments);
  const progressConcern = progress === 'Declining';

  let status: Status = 'Good';
  if (att.attendanceConcern || progressConcern) {
    status = 'Attention';
  } else if (att.totalSessions > 0 && att.attendanceRate < 85) {
    status = 'Monitor';
  }

  return {
    ...att,
    averageScore: avg,
    progress,
    progressConcern,
    status,
  };
}

export function fmtPct(n: number | null): string {
  if (n === null) return '-';
  return n.toFixed(1) + '%';
}
