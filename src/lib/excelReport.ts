import ExcelJS from 'exceljs';

export interface ExcelReportRow {
  id: string;
  name: string;
  dateOfBirth?: string;

  // Quiz 1: /10
  quiz1: number;

  // Quiz 2: /10
  quiz2: number;

  // Integrated Activities: /20
  integrated: number;

  // Global Test: /20
  globalTest?: number;
}

export interface ExcelReportOptions {
  schoolName: string;
  teacherName: string;
  academicYear: string;
  academy: string;
  province: string;
  level: string;
  subject: string;
  className: string;
  term: string;
  rows: ExcelReportRow[];
}

/* ===================================================== */
/* HELPERS                                               */
/* ===================================================== */

function formatDate(value?: string): string {
  if (!value) {
    return '';
  }

  const parts = value.split('-');

  if (parts.length !== 3) {
    return value;
  }

  const [year, month, day] = parts;

  return `${day}-${month}-${year}`;
}

/*
 * Convert any value to a safe number.
 */
function safeNumber(value: unknown): number {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return number;
}

/*
 * Keep a score inside its official range.
 */
function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.min(
    Math.max(value, min),
    max
  );
}

/*
 * Quiz 1 is /10.
 */
function getQuiz1(value: unknown): number {
  return clamp(
    safeNumber(value),
    0,
    10
  );
}

/*
 * Quiz 2 is /10.
 */
function getQuiz2(value: unknown): number {
  return clamp(
    safeNumber(value),
    0,
    10
  );
}

/*
 * Global Test is /20.
 */
function getGlobalTest(
  value: unknown
): number {
  return clamp(
    safeNumber(value),
    0,
    20
  );
}

/*
 * Integrated Activities is /20.
 */
function getIntegrated(
  value: unknown
): number {
  return clamp(
    safeNumber(value),
    0,
    20
  );
}

/*
 * First Test:
 *
 * Quiz 1 /10
 * +
 * Quiz 2 /10
 * =
 * First Test /20
 */
function getFirstTest(
  quiz1: unknown,
  quiz2: unknown
): number {
  const q1 = getQuiz1(quiz1);
  const q2 = getQuiz2(quiz2);

  return clamp(
    q1 + q2,
    0,
    20
  );
}

/*
 * Second Test:
 *
 * Global Test /20
 */
function getSecondTest(
  globalTest: unknown
): number {
  return getGlobalTest(globalTest);
}

/*
 * Safe filename part.
 */
function safeFilePart(
  value: string,
  fallback: string
): string {
  return (
    value
      .replace(/[\\/:*?"<>|]/g, '_')
      .trim() || fallback
  );
}

/* ===================================================== */
/* BORDER                                                */
/* ===================================================== */

function thinBlackBorder(): ExcelJS.Borders {
  return {
    top: {
      style: 'thin',
      color: {
        argb: 'FF000000',
      },
    },

    bottom: {
      style: 'thin',
      color: {
        argb: 'FF000000',
      },
    },

    left: {
      style: 'thin',
      color: {
        argb: 'FF000000',
      },
    },

    right: {
      style: 'thin',
      color: {
        argb: 'FF000000',
      },
    },

    diagonal: {},
  };
}

/* ===================================================== */
/* EXPORT EXCEL REPORT                                   */
/* ===================================================== */

export async function exportExcelReport(
  options: ExcelReportOptions
): Promise<void> {
  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    'Teacher Report System';

  workbook.lastModifiedBy =
    'Teacher Report System';

  workbook.created =
    new Date();

  workbook.modified =
    new Date();

  /* =================================================== */
  /* WORKSHEET                                           */
  /* =================================================== */

  const worksheet =
    workbook.addWorksheet(
      'نقط المراقبة المستمرة',
      {
        views: [
          {
            rightToLeft: true,
            showGridLines: false,
          },
        ],
      }
    );

  /* =================================================== */
  /* PAGE SETUP                                           */
  /* =================================================== */

  worksheet.pageSetup = {
    orientation: 'landscape',
    paperSize: 9,

    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,

    horizontalDpi: 300,
    verticalDpi: 300,

    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.4,
      bottom: 0.4,
      header: 0.2,
      footer: 0.2,
    },
  };

  /* =================================================== */
  /* COLUMN WIDTHS                                       */
  /* =================================================== */

  worksheet.columns = [
    {
      key: 'studentId',
      width: 19,
    },

    {
      key: 'studentName',
      width: 30,
    },

    {
      key: 'dateOfBirth',
      width: 18,
    },

    {
      key: 'firstTest',
      width: 16,
    },

    {
      key: 'secondTest',
      width: 16,
    },

    {
      key: 'integrated',
      width: 23,
    },

    {
      key: 'remarks',
      width: 25,
    },
  ];

  worksheet.properties.defaultRowHeight = 20;

  /* =================================================== */
  /* TITLE                                               */
  /* =================================================== */

  worksheet.mergeCells('A1:G1');

  const title =
    worksheet.getCell('A1');

  title.value =
    'نقط المراقبة المستمرة';

  title.font = {
    name: 'Arial',
    size: 18,
    bold: true,
    underline: true,
  };

  title.alignment = {
    horizontal: 'center',
    vertical: 'middle',
    readingOrder: 'rtl',
  };

  worksheet.getRow(1).height = 34;

  /* =================================================== */
  /* SPACE                                               */
  /* =================================================== */

  worksheet.getRow(2).height = 8;

  /* =================================================== */
  /* ADMINISTRATIVE HEADER                               */
  /* =================================================== */

  worksheet.mergeCells('A3:C3');
  worksheet.mergeCells('A4:C4');
  worksheet.mergeCells('A5:C5');
  worksheet.mergeCells('A6:C6');

  worksheet.mergeCells('D3:E3');
  worksheet.mergeCells('D4:E4');
  worksheet.mergeCells('D5:E5');

  worksheet.mergeCells('F3:G3');
  worksheet.mergeCells('F4:G4');
  worksheet.mergeCells('F5:G5');

  /* =================================================== */
  /* RIGHT BLOCK                                         */
  /* =================================================== */

  worksheet.getCell('A3').value =
    `أكاديمية : ${options.academy}`;

  worksheet.getCell('A4').value =
    `المستوى : ${options.level}`;

  worksheet.getCell('A5').value =
    `الدورة : ${options.term}`;

  worksheet.getCell('A6').value =
    `السنة الدراسية : ${options.academicYear}`;

  /* =================================================== */
  /* CENTER BLOCK                                        */
  /* =================================================== */

  worksheet.getCell('D3').value =
    `م.الإقليمية: ${options.province}`;

  worksheet.getCell('D4').value =
    `القسم : ${options.className}`;

  worksheet.getCell('D5').value =
    'نقط : ';

  /* =================================================== */
  /* LEFT BLOCK                                          */
  /* =================================================== */

  worksheet.getCell('F3').value =
    `مؤسسة : ${options.schoolName}`;

  worksheet.getCell('F4').value =
    `الاستاذ : ${options.teacherName}`;

  worksheet.getCell('F5').value =
    `المادة : ${options.subject}`;

  /* =================================================== */
  /* HEADER INFORMATION STYLE                            */
  /* =================================================== */

  const infoCells = [
    'A3',
    'A4',
    'A5',
    'A6',

    'D3',
    'D4',
    'D5',

    'F3',
    'F4',
    'F5',
  ];

  infoCells.forEach(
    (address) => {
      const cell =
        worksheet.getCell(address);

      const isCenter =
        address.startsWith('D');

      cell.font = {
        name: 'Arial',
        size: 11,
        bold: false,
      };

      cell.alignment = {
        horizontal: isCenter
          ? 'center'
          : 'right',

        vertical: 'middle',

        readingOrder: 'rtl',

        wrapText: true,
      };

      cell.border = {};
    }
  );

  worksheet.getRow(3).height = 22;
  worksheet.getRow(4).height = 22;
  worksheet.getRow(5).height = 22;
  worksheet.getRow(6).height = 22;

  /* =================================================== */
  /* TABLE HEADER                                        */
  /* =================================================== */

  worksheet.mergeCells('A8:A9');
  worksheet.mergeCells('B8:B9');
  worksheet.mergeCells('C8:C9');
  worksheet.mergeCells('G8:G9');

  worksheet.getCell('A8').value =
    'رقم التلميذ';

  worksheet.getCell('B8').value =
    'إسم التلميذ';

  worksheet.getCell('C8').value =
    'تاريخ الإزدياد';

  worksheet.getCell('D8').value =
    'الفرض الأول';

  worksheet.getCell('E8').value =
    'الفرض الثاني';

  worksheet.getCell('F8').value =
    'الأنشطة المندمجة';

  worksheet.getCell('G8').value =
    'ملاحظات الأستاذ';

  /* =================================================== */
  /* SUB HEADERS                                         */
  /* =================================================== */

  worksheet.getCell('D9').value =
    'النقطة';

  worksheet.getCell('E9').value =
    'النقطة';

  worksheet.getCell('F9').value =
    'النقطة';

  /* =================================================== */
  /* TABLE HEADER STYLE                                  */
  /* =================================================== */

  for (
    let rowNumber = 8;
    rowNumber <= 9;
    rowNumber++
  ) {
    const row =
      worksheet.getRow(rowNumber);

    row.height = 32;

    for (
      let columnNumber = 1;
      columnNumber <= 7;
      columnNumber++
    ) {
      const cell =
        row.getCell(
          columnNumber
        );

      cell.font = {
        name: 'Arial',
        size: 11,
        bold: true,
      };

      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        readingOrder: 'rtl',
        wrapText: true,
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: 'FFE7E7E7',
        },
      };

      cell.border =
        thinBlackBorder();
    }
  }

  /* =================================================== */
  /* DATA                                                */
  /* =================================================== */

  const firstDataRow = 10;

  options.rows.forEach(
    (student, index) => {
      const rowNumber =
        firstDataRow + index;

      const row =
        worksheet.getRow(
          rowNumber
        );

      /*
       * =================================================
       * OFFICIAL SCORES
       * =================================================
       *
       * Quiz 1       = /10
       * Quiz 2       = /10
       *
       * First Test   = Quiz 1 + Quiz 2 = /20
       *
       * Global Test  = /20
       *
       * Second Test  = Global Test = /20
       *
       * Integrated   = /20
       *
       * NO TOTAL
       */

      const quiz1 =
        getQuiz1(
          student.quiz1
        );

      const quiz2 =
        getQuiz2(
          student.quiz2
        );

      const globalTest =
        getGlobalTest(
          student.globalTest
        );

      const integrated =
        getIntegrated(
          student.integrated
        );

      /*
       * First Test = Quiz 1 + Quiz 2
       *
       * Example:
       *
       * Q1 = 5
       * Q2 = 5
       *
       * First Test = 10
       */

      const firstTest =
        getFirstTest(
          quiz1,
          quiz2
        );

      /*
       * Second Test = Global Test
       *
       * Example:
       *
       * Global Test = 15
       *
       * Second Test = 15
       */

      const secondTest =
        getSecondTest(
          globalTest
        );

      /*
       * IMPORTANT:
       *
       * We write the calculated values directly.
       * There are NO Excel formulas.
       */

      row.getCell(1).value =
        student.id;

      row.getCell(2).value =
        student.name;

      row.getCell(3).value =
        formatDate(
          student.dateOfBirth
        );

      row.getCell(4).value =
        firstTest;

      row.getCell(5).value =
        secondTest;

      row.getCell(6).value =
        integrated;

      row.getCell(7).value =
        '-';

      row.height = 23;

      /* ================================================= */
      /* ALIGNMENT                                         */
      /* ================================================= */

      row.getCell(1).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };

      row.getCell(2).alignment = {
        horizontal: 'right',
        vertical: 'middle',
        readingOrder: 'rtl',
        wrapText: true,
      };

      row.getCell(3).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };

      /*
       * Scores
       */

      for (
        let columnNumber = 4;
        columnNumber <= 6;
        columnNumber++
      ) {
        const cell =
          row.getCell(
            columnNumber
          );

        cell.numFmt =
          '0.00';

        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
      }

      row.getCell(7).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };

      /* ================================================= */
      /* BORDERS                                           */
      /* ================================================= */

      for (
        let columnNumber = 1;
        columnNumber <= 7;
        columnNumber++
      ) {
        const cell =
          row.getCell(
            columnNumber
          );

        cell.font = {
          name: 'Arial',
          size: 11,
        };

        cell.border =
          thinBlackBorder();
      }
    }
  );

  /* =================================================== */
  /* FOOTER                                              */
  /* =================================================== */

  const lastDataRow =
    options.rows.length > 0
      ? firstDataRow +
        options.rows.length -
        1
      : firstDataRow;

  const footerRow =
    lastDataRow + 2;

  worksheet.mergeCells(
    `A${footerRow}:G${footerRow}`
  );

  const footerCell =
    worksheet.getCell(
      `A${footerRow}`
    );

  footerCell.value =
    `الأستاذ: ${options.teacherName}`;

  footerCell.font = {
    name: 'Arial',
    size: 11,
  };

  footerCell.alignment = {
    horizontal: 'right',
    vertical: 'middle',
    readingOrder: 'rtl',
  };

  worksheet.getRow(
    footerRow
  ).height = 24;

  /* =================================================== */
  /* PRINT AREA                                          */
  /* =================================================== */

  worksheet.pageSetup.printArea =
    `A1:G${footerRow}`;

  /* =================================================== */
  /* REPEAT TABLE HEADER                                 */
  /* =================================================== */

  worksheet.pageSetup.printTitlesRow =
    '8:9';

  /* =================================================== */
  /* FINAL VIEW SETTINGS                                 */
  /* =================================================== */

  worksheet.views = [
    {
      rightToLeft: true,
      showGridLines: false,
      state: 'frozen',
      ySplit: 9,
    },
  ];

  /* =================================================== */
  /* EXPORT                                               */
  /* =================================================== */

  const buffer =
    await workbook.xlsx.writeBuffer();

  const blob =
    new Blob(
      [buffer],
      {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    );

  const url =
    window.URL.createObjectURL(
      blob
    );

  const link =
    document.createElement('a');

  link.href = url;

  const safeClass =
    safeFilePart(
      options.className,
      'Class'
    );

  const safeTerm =
    safeFilePart(
      options.term,
      'Term'
    );

  link.download =
    `نقط_المراقبة_المستمرة_${safeClass}_${safeTerm}.xlsx`;

  document.body.appendChild(
    link
  );

  link.click();

  document.body.removeChild(
    link
  );

  window.URL.revokeObjectURL(
    url
  );
}