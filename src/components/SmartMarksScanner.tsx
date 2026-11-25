
import { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Download,
  FileText,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import type {
  Student,
  AssessmentRecord,
  DiagnosticTestRecord,
  IntegratedActivityRecord,
  OfficialAssessment,
  Term,
} from '@/types';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

type ColumnSource =
  | OfficialAssessment
  | 'Diagnostic Test'
  | 'Integrated Activities';

interface FillColumn {
  id: string;
  label: string;
  source: ColumnSource;
  x: number;
  maxScore: number;
}

interface Props {
  onClose: () => void;
  students: Student[];
  assessments: AssessmentRecord[];
  diagnosticTests: DiagnosticTestRecord[];
  integratedActivities: IntegratedActivityRecord[];
  classId: string;
  academicYear: string;
  term: Term;
}

const MAX_SIZE = 20 * 1024 * 1024;

const DEFAULT_COLUMNS: FillColumn[] = [
  {
    id: 'column-1',
    label: 'Quiz 1',
    source: 'Quiz 1',
    x: 72,
    maxScore: 10,
  },
];

const cleanNumber = (value: number) =>
  Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));

export default function SmartMarksScanner({
  onClose,
  students,
  assessments,
  diagnosticTests,
  integratedActivities,
  classId,
  academicYear,
  term,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileKind, setFileKind] = useState<'pdf' | 'image' | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [rowStart, setRowStart] = useState(30);
  const [rowHeight, setRowHeight] = useState(3);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [fontSize, setFontSize] = useState(11);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [columns, setColumns] = useState<FillColumn[]>(DEFAULT_COLUMNS);

  const marksByStudent = useMemo(() => {
    const result = new Map<string, Record<string, number>>();

    for (const student of students) {
      const marks: Record<string, number> = {};

      for (const column of columns) {
        if (column.source === 'Integrated Activities') {
          const record = integratedActivities.find((item) =>
            item.studentId === student.id &&
            item.classId === classId &&
            item.academicYear === academicYear &&
            item.term === term &&
            item.date === selectedDate
          );

          if (record) marks[column.id] = record.total;
        } else if (column.source === 'Diagnostic Test') {
          const record = diagnosticTests.find((item) =>
            item.studentId === student.id &&
            item.classId === classId &&
            item.academicYear === academicYear &&
            item.term === term
          );

          if (record) marks[column.id] = record.score;
        } else {
          const record = assessments.find((item) =>
            item.studentId === student.id &&
            item.classId === classId &&
            item.academicYear === academicYear &&
            item.term === term &&
            item.name === column.source
          );

          if (record) marks[column.id] = record.score;
        }
      }

      result.set(student.id, marks);
    }

    return result;
  }, [
    students,
    columns,
    assessments,
    diagnosticTests,
    integratedActivities,
    classId,
    academicYear,
    term,
    selectedDate,
  ]);

  const addColumn = () => {
    const id = `column-${Date.now()}`;

    setColumns((current) => [
      ...current,
      {
        id,
        label: 'Quiz 2',
        source: 'Quiz 2',
        x: Math.min(90, 72 + current.length * 5),
        maxScore: 10,
      },
    ]);
  };

  const updateColumn = (id: string, patch: Partial<FillColumn>) => {
    setColumns((current) =>
      current.map((column) =>
        column.id === id ? { ...column, ...patch } : column
      )
    );
  };

  const removeColumn = (id: string) => {
    setColumns((current) => current.filter((column) => column.id !== id));
  };

  const getMark = (studentIndex: number, columnId: string) => {
    const student = students[studentIndex];
    if (!student) return undefined;
    return marksByStudent.get(student.id)?.[columnId];
  };

  const drawOverlay = (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    pageIndex: number
  ) => {
    const firstStudentIndex = pageIndex * rowsPerPage;

    context.save();
    context.fillStyle = '#111827';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `bold ${fontSize * (width / 1000)}px Arial`;

    for (let row = 0; row < rowsPerPage; row += 1) {
      const studentIndex = firstStudentIndex + row;
      if (studentIndex >= students.length) break;

      const y = ((rowStart + row * rowHeight) / 100) * height;

      for (const column of columns) {
        const mark = getMark(studentIndex, column.id);
        if (mark === undefined) continue;

        const x = (column.x / 100) * width;

        context.fillText(
          cleanNumber(mark),
          x,
          y
        );
      }
    }

    context.restore();
  };

  const renderPreview = async (
    selectedFile: File,
    kind: 'pdf' | 'image'
  ) => {
    if (kind === 'image') {
      const url = URL.createObjectURL(selectedFile);
      const image = new Image();

      image.onload = () => {
        setImageElement(image);
        setPreviewUrl(url);

        const canvas = previewCanvasRef.current;
        if (!canvas) return;

        const scale = Math.min(1200 / image.width, 1);
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;

        const context = canvas.getContext('2d');
        if (!context) return;

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        drawOverlay(context, canvas.width, canvas.height, 0);
      };

      image.onerror = () => setError('تعذر فتح الصورة.');
      image.src = url;
      return;
    }

    const bytes = await selectedFile.arrayBuffer();
    setPdfBytes(bytes);

    const document = await pdfjs.getDocument({
      data: new Uint8Array(bytes.slice(0)),
    }).promise;

    const page = await document.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    if (!context) return;

    await page.render({
      canvasContext: context,
      canvas,
      viewport,
    }).promise;

    drawOverlay(context, canvas.width, canvas.height, 0);
    setPreviewUrl('pdf-preview');
  };

  const handleFile = async (selected: File) => {
    setError('');

    const isPdf = selected.type === 'application/pdf';
    const isImage = ['image/png', 'image/jpeg'].includes(selected.type);

    if (!isPdf && !isImage) {
      setError('اختار PDF أو PNG أو JPG فقط.');
      return;
    }

    if (selected.size > MAX_SIZE) {
      setError('حجم الملف خاصو ما يفوتش 20 MB.');
      return;
    }

    setBusy(true);
    setFile(selected);
    setImageElement(null);
    setPdfBytes(null);
    setPreviewUrl('');

    try {
      const kind = isPdf ? 'pdf' : 'image';
      setFileKind(kind);
      await renderPreview(selected, kind);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'وقع خطأ أثناء فتح الملف.'
      );
      setFile(null);
      setFileKind(null);
    } finally {
      setBusy(false);
    }
  };

  const refreshPreview = async () => {
    if (!file || !fileKind) return;

    try {
      if (fileKind === 'image' && imageElement) {
        const canvas = previewCanvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
        drawOverlay(context, canvas.width, canvas.height, 0);
      } else if (fileKind === 'pdf' && pdfBytes) {
        const document = await pdfjs.getDocument({
          data: new Uint8Array(pdfBytes.slice(0)),
        }).promise;

        const page = await document.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = previewCanvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;

        await page.render({
          canvasContext: context,
          canvas,
          viewport,
        }).promise;

        drawOverlay(context, canvas.width, canvas.height, 0);
      }
    } catch {
      setError('تعذر تحديث المعاينة.');
    }
  };

  const exportImage = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `filled-mark-list-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const exportPdf = async () => {
    if (!pdfBytes) return;

    setBusy(true);
    setError('');

    try {
      const original = await PDFDocument.load(pdfBytes);
      const font = await original.embedFont(StandardFonts.Helvetica);
      const pages = original.getPages();

      for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
        const page = pages[pageIndex];
        const { width, height } = page.getSize();

        const overlayCanvas = document.createElement('canvas');
        const scale = 2;

        overlayCanvas.width = Math.round(width * scale);
        overlayCanvas.height = Math.round(height * scale);

        const context = overlayCanvas.getContext('2d');
        if (!context) continue;

        context.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        context.fillStyle = '#111827';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = `bold ${fontSize * scale}px Arial`;

        const firstStudentIndex = pageIndex * rowsPerPage;

        for (let row = 0; row < rowsPerPage; row += 1) {
          const studentIndex = firstStudentIndex + row;
          if (studentIndex >= students.length) break;

          const y = ((rowStart + row * rowHeight) / 100) * overlayCanvas.height;

          for (const column of columns) {
            const mark = getMark(studentIndex, column.id);
            if (mark === undefined) continue;

            const x = (column.x / 100) * overlayCanvas.width;

            context.fillText(cleanNumber(mark), x, y);
          }
        }

        const imageBytes = await new Promise<Uint8Array>((resolve, reject) => {
          overlayCanvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error('تعذر إنشاء طبقة النقط.'));
              return;
            }
            resolve(new Uint8Array(await blob.arrayBuffer()));
          }, 'image/png');
        });

        const overlay = await original.embedPng(imageBytes);

        page.drawImage(overlay, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }

      const output = await original.save();
      const blob = new Blob([output as BlobPart], {
        type: 'application/pdf',
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `filled-mark-list-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'تعذر تصدير PDF.'
      );
    } finally {
      setBusy(false);
    }
  };

  const missingCount = students.filter((student, index) =>
    columns.some((column) => getMark(index, column.id) === undefined)
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3">
      <div className="flex max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Fill Marks List
            </h2>
            <p className="text-sm text-slate-500">
              قراءة النقط المسجلة وتعبئة نسخة من اللائحة الأصلية
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[340px_1fr]">
          <section className="space-y-4">
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-5 text-center">
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                className="hidden"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (selected) void handleFile(selected);
                  event.target.value = '';
                }}
              />

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Upload size={17} />
                Upload original list
              </button>

              <p className="mt-2 text-xs text-slate-500">
                PDF, PNG, JPG · Maximum 20 MB
              </p>

              {file && (
                <p className="mt-3 break-all text-sm font-medium text-slate-700">
                  {file.name}
                </p>
              )}
            </div>

            <div className="rounded-xl border p-4">
              <h3 className="mb-3 font-semibold">Student rows</h3>

              <label className="mb-2 block text-sm">
                First student row position: {rowStart}%
              </label>
              <input
                type="range"
                min="5"
                max="95"
                value={rowStart}
                onChange={(event) => setRowStart(Number(event.target.value))}
                className="w-full"
              />

              <label className="mb-2 mt-4 block text-sm">
                Distance between rows: {rowHeight}%
              </label>
              <input
                type="range"
                min="0.5"
                max="8"
                step="0.1"
                value={rowHeight}
                onChange={(event) => setRowHeight(Number(event.target.value))}
                className="w-full"
              />

              <label className="mb-2 mt-4 block text-sm">
                Students per page
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={rowsPerPage}
                onChange={(event) =>
                  setRowsPerPage(Math.max(1, Number(event.target.value)))
                }
                className="w-full rounded-lg border px-3 py-2"
              />

              <label className="mb-2 mt-4 block text-sm">
                Mark font size: {fontSize}
              </label>
              <input
                type="range"
                min="6"
                max="20"
                value={fontSize}
                onChange={(event) => setFontSize(Number(event.target.value))}
                className="w-full"
              />
            </div>

            <div className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Mark columns</h3>
                <button
                  type="button"
                  onClick={addColumn}
                  className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700"
                >
                  <Plus size={14} />
                  Add column
                </button>
              </div>

              <div className="space-y-3">
                {columns.map((column) => (
                  <div key={column.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">
                        Column
                      </span>
                      {columns.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeColumn(column.id)}
                          className="text-rose-600"
                          aria-label="Remove column"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <input
                      value={column.label}
                      onChange={(event) =>
                        updateColumn(column.id, { label: event.target.value })
                      }
                      placeholder="Column label"
                      className="mb-2 w-full rounded-lg border px-2 py-1.5 text-sm"
                    />

                    <select
                      value={column.source}
                      onChange={(event) => {
                        const source = event.target.value as ColumnSource;
                        const maxScore =
                          source === 'Quiz 1' || source === 'Quiz 2' ? 10 : 20;

                        updateColumn(column.id, { source, maxScore });
                      }}
                      className="mb-2 w-full rounded-lg border px-2 py-1.5 text-sm"
                    >
                      <option value="Quiz 1">Quiz 1</option>
                      <option value="Quiz 2">Quiz 2</option>
                      <option value="Global Test">Global Test</option>
                      <option value="Diagnostic Test">Diagnostic Test</option>
                      <option value="Integrated Activities">
                        Integrated Activities
                      </option>
                    </select>

                    {column.source === 'Integrated Activities' && (
                      <label className="mb-2 block text-xs text-slate-600">
                        Activity date
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(event) => setSelectedDate(event.target.value)}
                          className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                        />
                      </label>
                    )}

                    <label className="block text-xs text-slate-600">
                      Horizontal position: {column.x}%
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={column.x}
                        onChange={(event) =>
                          updateColumn(column.id, { x: Number(event.target.value) })
                        }
                        className="mt-1 w-full"
                      />
                    </label>

                    <p className="mt-1 text-xs text-slate-500">
                      Maximum: {column.maxScore}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p>Students in class: <strong>{students.length}</strong></p>
              <p>Students with at least one missing mark: <strong>{missingCount}</strong></p>
              <p className="mt-2 text-xs text-amber-700">
                تأكد أن ترتيب اللائحة مطابق لترتيب التلاميذ فالتطبيق. الخانات الفارغة فالسجلات غتبقى فارغة فالوثيقة.
              </p>
            </div>
          </section>

          <section className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Preview</h3>
              <button
                type="button"
                onClick={() => void refreshPreview()}
                disabled={!file || busy}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                Refresh preview
              </button>
            </div>

            {busy && (
              <p className="text-sm text-slate-500">Processing file…</p>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {!file && (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border bg-slate-50 text-slate-400">
                <FileText size={42} />
                <p className="mt-3 text-sm">Upload your original mark list</p>
              </div>
            )}

            {file && (
              <div className="max-h-[65vh] overflow-auto rounded-xl border bg-slate-100 p-2">
                <canvas
                  ref={previewCanvasRef}
                  className="mx-auto h-auto max-w-full bg-white shadow"
                />
              </div>
            )}

            {file && (
              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={busy || !previewUrl}
                  onClick={() => {
                    if (fileKind === 'pdf') void exportPdf();
                    else exportImage();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Download size={16} />
                  Export filled copy
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
