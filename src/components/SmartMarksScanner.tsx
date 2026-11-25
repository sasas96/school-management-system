import { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ScannerStudent {
  id: string;
  name: string;
  massarCode?: string;
}

interface ImportedMark {
  studentId: string;
  score: number;
  overwrite: boolean;
}

interface ReviewRow {
  id: string;
  sourceName: string;
  sourceCode: string;
  rawScore: string;
  studentId: string;
  score: string;
  error: string;
  overwrite: boolean;
}

interface SmartMarksScannerProps {
  onClose: () => void;
  students: ScannerStudent[];
  maxScore: number;
  assessmentLabel: string;
  existingScores: Record<string, number>;
  onConfirm: (marks: ImportedMark[]) => void;
}

const ACCEPTED_TYPES = ['.xlsx', '.xls', '.csv'];
const MAX_FILE_SIZE = 15 * 1024 * 1024;

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');

const headerKind = (value: unknown): 'code' | 'name' | 'score' | null => {
  const text = normalize(value);
  if (!text) return null;
  if (/(massar|cne|codeeleve|studentcode|رقممسار|رمزمسار)/u.test(text)) return 'code';
  if (/(name|fullname|student|nom|prenom|الاسم|التلميذ)/u.test(text)) return 'name';
  if (/(score|mark|grade|note|النقطة|النقط|المعدل)/u.test(text)) return 'score';
  return null;
};

const getStudentMatch = (
  code: string,
  name: string,
  students: ScannerStudent[]
) => {
  const cleanCode = normalize(code);
  if (cleanCode) {
    const byCode = students.filter((student) => normalize(student.massarCode) === cleanCode);
    if (byCode.length === 1) return byCode[0].id;
  }
  const cleanName = normalize(name);
  if (cleanName) {
    const byName = students.filter((student) => normalize(student.name) === cleanName);
    if (byName.length === 1) return byName[0].id;
  }
  return '';
};

export default function SmartMarksScanner({
  onClose,
  students,
  maxScore,
  assessmentLabel,
  existingScores,
  onConfirm,
}: SmartMarksScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [processing, setProcessing] = useState(false);

  const mappedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      if (row.studentId) counts.set(row.studentId, (counts.get(row.studentId) ?? 0) + 1);
    });
    return counts;
  }, [rows]);

  const updateRow = (id: string, patch: Partial<ReviewRow>) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  };

  const processFile = async (selected: File) => {
    const extension = `.${selected.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (!ACCEPTED_TYPES.includes(extension)) {
      setError('حالياً الاستيراد المباشر متاح لملفات Excel وCSV فقط. دعم PDF والصور غادي نضيفوه بمرحلة OCR.');
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError('حجم الملف خاصو ما يفوتش 15 MB.');
      return;
    }
    setFile(selected);
    setError('');
    setNotice('');
    setProcessing(true);
    try {
      const buffer = await selected.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) throw new Error('الملف ما فيه حتى ورقة بيانات.');
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
        header: 1,
        defval: '',
        raw: false,
      });
      const nonEmpty = matrix
        .map((row) => row.map((cell) => String(cell ?? '').trim()))
        .filter((row) => row.some(Boolean));
      if (nonEmpty.length < 2) throw new Error('ما لقيتش بيانات كافية فالملف.');

      let headerIndex = -1;
      let columns = { code: -1, name: -1, score: -1 };
      for (let i = 0; i < Math.min(nonEmpty.length, 10); i += 1) {
        const detected = { code: -1, name: -1, score: -1 };
        nonEmpty[i].forEach((cell, index) => {
          const kind = headerKind(cell);
          if (kind && detected[kind] === -1) detected[kind] = index;
        });
        if (detected.name !== -1 && detected.score !== -1) {
          headerIndex = i;
          columns = detected;
          break;
        }
      }

      if (headerIndex === -1) {
        // Fallback for simple two-column files: Student name in column A, mark in B.
        columns = { code: -1, name: 0, score: 1 };
        headerIndex = -1;
        setNotice('ما تعرفوش على عناوين الأعمدة تلقائياً؛ استعملنا العمود A للاسم والعمود B للنقطة. راجع المطابقة قبل التأكيد.');
      }

      const dataRows = nonEmpty.slice(headerIndex + 1);
      const parsed: ReviewRow[] = dataRows.map((cells, index) => {
        const sourceCode = columns.code >= 0 ? String(cells[columns.code] ?? '').trim() : '';
        const sourceName = String(cells[columns.name] ?? '').trim();
        const rawScore = String(cells[columns.score] ?? '').trim().replace(',', '.');
        const studentId = getStudentMatch(sourceCode, sourceName, students);
        const scoreNumber = Number(rawScore);
        let rowError = '';
        if (!sourceName && !sourceCode) rowError = 'الاسم ورمز مسار غير موجودين';
        else if (!studentId) rowError = 'خاصك تختار التلميذ يدوياً';
        if (!rawScore || !Number.isFinite(scoreNumber)) rowError = rowError || 'النقطة غير مقروءة';
        else if (scoreNumber < 0 || scoreNumber > maxScore) rowError = `النقطة خاصها تكون بين 0 و${maxScore}`;
        return {
          id: `row-${Date.now()}-${index}`,
          sourceName,
          sourceCode,
          rawScore,
          studentId,
          score: Number.isFinite(scoreNumber) ? String(scoreNumber) : rawScore,
          error: rowError,
          overwrite: false,
        };
      }).filter((row) => row.sourceName || row.sourceCode || row.rawScore);

      if (parsed.length === 0) throw new Error('ما لقيتش أسطر فيها أسماء أو نقط.');
      setRows(parsed);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'وقع خطأ أثناء قراءة الملف.');
      setRows([]);
    } finally {
      setProcessing(false);
    }
  };

  const readyRows = rows.filter((row) => {
    const score = Number(row.score);
    return row.studentId && row.score.trim() !== '' && Number.isFinite(score) &&
      score >= 0 && score <= maxScore && mappedCounts.get(row.studentId) === 1 &&
      (existingScores[row.studentId] === undefined || row.overwrite);
  });

  const handleConfirm = () => {
    const invalidCount = rows.length - readyRows.length;
    if (invalidCount > 0) {
      setError(`باقي ${invalidCount} سطر خاصو يتراجع. صحح الأخطاء أو حيّد الأسطر غير المطلوبة قبل الاستيراد.`);
      return;
    }
    if (readyRows.length === 0) {
      setError('ما كايناش نقط صالحة للاستيراد.');
      return;
    }
    onConfirm(readyRows.map((row) => ({
      studentId: row.studentId,
      score: Number(row.score),
      overwrite: row.overwrite,
    })));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-5">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2 text-slate-900">
              <span className="rounded-lg bg-sky-100 p-2 text-sky-700"><FileSpreadsheet size={20} /></span>
              <h2 className="text-lg font-bold">Smart Marks Scanner</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">{assessmentLabel} · Maximum mark: {maxScore}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close scanner"><X size={20} /></button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5 sm:p-6">
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) void processFile(selected);
              event.target.value = '';
            }} />
            <button type="button" onClick={() => inputRef.current?.click()} disabled={processing} className="mx-auto inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
              {processing ? <Loader2 className="animate-spin" size={17} /> : <Upload size={17} />}
              {processing ? 'Reading file…' : file ? 'Choose another file' : 'Upload Excel or CSV'}
            </button>
            <p className="mt-2 text-xs text-slate-500">XLSX, XLS, CSV · Maximum 15 MB</p>
            {file && <p className="mt-2 text-sm font-medium text-slate-700">{file.name}</p>}
          </div>

          {notice && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{notice}</div>}
          {error && <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}

          {rows.length > 0 && <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-800">Review extracted marks</h3>
                <p className="text-xs text-slate-500">{rows.length} rows found · {readyRows.length} ready to import</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><CheckCircle2 size={14} /> Nothing is saved yet</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-[850px] w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-3">File name / code</th>
                    <th className="px-3 py-3">Matched student</th>
                    <th className="px-3 py-3">Mark /{maxScore}</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Existing mark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const existing = row.studentId ? existingScores[row.studentId] : undefined;
                    const duplicate = row.studentId ? (mappedCounts.get(row.studentId) ?? 0) > 1 : false;
                    const score = Number(row.score);
                    const scoreInvalid = row.score.trim() === '' || !Number.isFinite(score) || score < 0 || score > maxScore;
                    return <tr key={row.id} className="align-top">
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-800">{row.sourceName || '—'}</p>
                        <p className="text-xs text-slate-500">{row.sourceCode || 'No Massar code'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <select value={row.studentId} onChange={(event) => updateRow(row.id, { studentId: event.target.value, overwrite: false })} className="w-64 rounded-lg border border-slate-300 px-2 py-2 text-sm">
                          <option value="">Select student…</option>
                          {students.map((student) => <option key={student.id} value={student.id}>{student.name}{student.massarCode ? ` · ${student.massarCode}` : ''}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-3"><input type="number" min="0" max={maxScore} step="0.5" value={row.score} onChange={(event) => updateRow(row.id, { score: event.target.value })} className={`w-24 rounded-lg border px-2 py-2 ${scoreInvalid ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`} /></td>
                      <td className="px-3 py-3">
                        {duplicate ? <span className="text-xs font-medium text-rose-700">Duplicate student row</span>
                          : !row.studentId ? <span className="text-xs text-amber-700">Needs matching</span>
                          : scoreInvalid ? <span className="text-xs text-rose-700">Invalid mark</span>
                          : existing !== undefined && !row.overwrite ? <label className="flex max-w-44 items-start gap-2 text-xs text-amber-800"><input type="checkbox" checked={false} onChange={() => updateRow(row.id, { overwrite: true })} className="mt-0.5" /> Allow replacing existing mark</label>
                          : <span className="text-xs font-medium text-emerald-700">Ready</span>}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{existing === undefined ? '—' : <span>{existing}/{maxScore}{row.overwrite && <span className="ml-1 text-xs text-amber-700">(replace)</span>}</span>}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500">Rows with duplicate student matches must be corrected. Existing marks are protected unless you explicitly allow replacement.</p>
          </>}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleConfirm} disabled={rows.length === 0 || processing || readyRows.length !== rows.length} className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">Confirm Import ({readyRows.length})</button>
        </div>
      </div>
    </div>
  );
}
