
import type { AppData } from '@/types';

export function demoData(): AppData {
  const classes = [
    {
      id: '7A',
      name: '7A',
      grade: '7th Grade',
      academicYear: '2026/2027',
    },
    {
      id: '7B',
      name: '7B',
      grade: '7th Grade',
      academicYear: '2026/2027',
    },
    {
      id: '8A',
      name: '8A',
      grade: '8th Grade',
      academicYear: '2026/2027',
    },
    {
      id: '8B',
      name: '8B',
      grade: '8th Grade',
      academicYear: '2026/2027',
    },
    {
      id: '9A',
      name: '9A',
      grade: '9th Grade',
      academicYear: '2026/2027',
    },
    {
      id: '9B',
      name: '9B',
      grade: '9th Grade',
      academicYear: '2026/2027',
    },
  ];

  const students = [
    // 7A
    {
      id: 'STU001',
      massarCode: '',
      name: 'محمد أمين العلوي',
      nameAr: 'محمد أمين العلوي',
      classId: '7A',
      gender: 'Male' as const,
    },
    {
      id: 'STU002',
      massarCode: '',
      name: 'سلمى الإدريسي',
      nameAr: 'سلمى الإدريسي',
      classId: '7A',
      gender: 'Female' as const,
    },
    {
      id: 'STU003',
      massarCode: '',
      name: 'يوسف بنعلي',
      nameAr: 'يوسف بنعلي',
      classId: '7A',
      gender: 'Male' as const,
    },
    {
      id: 'STU004',
      massarCode: '',
      name: 'آية الحسناوي',
      nameAr: 'آية الحسناوي',
      classId: '7A',
      gender: 'Female' as const,
    },

    // 7B
    {
      id: 'STU005',
      massarCode: '',
      name: 'حمزة المرابط',
      nameAr: 'حمزة المرابط',
      classId: '7B',
      gender: 'Male' as const,
    },
    {
      id: 'STU006',
      massarCode: '',
      name: 'مريم الزهراء',
      nameAr: 'مريم الزهراء',
      classId: '7B',
      gender: 'Female' as const,
    },
    {
      id: 'STU007',
      massarCode: '',
      name: 'أنس الكتاني',
      nameAr: 'أنس الكتاني',
      classId: '7B',
      gender: 'Male' as const,
    },
    {
      id: 'STU008',
      massarCode: '',
      name: 'إيمان الفاسي',
      nameAr: 'إيمان الفاسي',
      classId: '7B',
      gender: 'Female' as const,
    },

    // 8A
    {
      id: 'STU009',
      massarCode: '',
      name: 'عبد الرحمان التازي',
      nameAr: 'عبد الرحمان التازي',
      classId: '8A',
      gender: 'Male' as const,
    },
    {
      id: 'STU010',
      massarCode: '',
      name: 'سارة العمري',
      nameAr: 'سارة العمري',
      classId: '8A',
      gender: 'Female' as const,
    },
    {
      id: 'STU011',
      massarCode: '',
      name: 'أيوب الراشدي',
      nameAr: 'أيوب الراشدي',
      classId: '8A',
      gender: 'Male' as const,
    },
    {
      id: 'STU012',
      massarCode: '',
      name: 'هدى بنعيسى',
      nameAr: 'هدى بنعيسى',
      classId: '8A',
      gender: 'Female' as const,
    },

    // 8B
    {
      id: 'STU013',
      massarCode: '',
      name: 'يوسف العثماني',
      nameAr: 'يوسف العثماني',
      classId: '8B',
      gender: 'Male' as const,
    },
    {
      id: 'STU014',
      massarCode: '',
      name: 'نور الهدى',
      nameAr: 'نور الهدى',
      classId: '8B',
      gender: 'Female' as const,
    },
    {
      id: 'STU015',
      massarCode: '',
      name: 'إلياس الصديقي',
      nameAr: 'إلياس الصديقي',
      classId: '8B',
      gender: 'Male' as const,
    },
    {
      id: 'STU016',
      massarCode: '',
      name: 'كوثر أمين',
      nameAr: 'كوثر أمين',
      classId: '8B',
      gender: 'Female' as const,
    },

    // 9A
    {
      id: 'STU017',
      massarCode: '',
      name: 'أيمن العروسي',
      nameAr: 'أيمن العروسي',
      classId: '9A',
      gender: 'Male' as const,
    },
    {
      id: 'STU018',
      massarCode: '',
      name: 'ملاك الإدريسي',
      nameAr: 'ملاك الإدريسي',
      classId: '9A',
      gender: 'Female' as const,
    },
    {
      id: 'STU019',
      massarCode: '',
      name: 'رضوان الشاوي',
      nameAr: 'رضوان الشاوي',
      classId: '9A',
      gender: 'Male' as const,
    },
    {
      id: 'STU020',
      massarCode: '',
      name: 'ريم التازي',
      nameAr: 'ريم التازي',
      classId: '9A',
      gender: 'Female' as const,
    },

    // 9B
    {
      id: 'STU021',
      massarCode: '',
      name: 'سفيان المريني',
      nameAr: 'سفيان المريني',
      classId: '9B',
      gender: 'Male' as const,
    },
    {
      id: 'STU022',
      massarCode: '',
      name: 'جنان الفاسي',
      nameAr: 'جنان الفاسي',
      classId: '9B',
      gender: 'Female' as const,
    },
    {
      id: 'STU023',
      massarCode: '',
      name: 'بلال الحسيني',
      nameAr: 'بلال الحسيني',
      classId: '9B',
      gender: 'Male' as const,
    },
    {
      id: 'STU024',
      massarCode: '',
      name: 'دعاء بنعلي',
      nameAr: 'دعاء بنعلي',
      classId: '9B',
      gender: 'Female' as const,
    },
  ];

  const dates = [
    '2026-09-01',
    '2026-09-03',
    '2026-09-08',
    '2026-09-10',
  ];

  const attendance: AppData['attendance'] = [];

  let attendanceId = 1;

  for (const student of students) {
    dates.forEach((date, index) => {
      let status: 'Present' | 'Late' | 'Absent' = 'Present';

      if (index === 2) {
        status = 'Late';
      }

      if (student.id === 'STU002' && index === 3) {
        status = 'Absent';
      }

      if (student.id === 'STU008' && index >= 2) {
        status = index % 2 === 0 ? 'Absent' : 'Late';
      }

      if (student.id === 'STU019' && index === 3) {
        status = 'Absent';
      }

      attendance.push({
        id: `ATT${String(attendanceId++).padStart(4, '0')}`,
        studentId: student.id,
        classId: student.classId,
        date,
        status,
      });
    });
  }

  const assessments: AppData['assessments'] = [];

  let assessmentId = 1;

  const assessmentDates = [
    '2026-09-02',
    '2026-09-09',
  ];

  for (const student of students) {
    assessmentDates.forEach((date, index) => {
      const id = assessmentId++;

      assessments.push({
        id: `ASM${String(id).padStart(4, '0')}`,
        studentId: student.id,
        classId: student.classId,
        academicYear: '2026/2027',
        date,
        name: index === 0 ? 'Quiz 1' : 'Quiz 2',
        type: 'Quiz',
        term: 'First Term',
        score: 6 + (id % 5),
        maxScore: 10,
      });
    });
  }

  return {
    classes,
    students,
    attendance,
    assessments,
    integratedActivities: [],
  };
}
