'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

type Row = Record<string, string>;

interface ValidationResult {
  row: Row;
  valid: boolean;
  errors: string[];
}

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

const TEMPLATE_HEADERS = 'firstName,lastName,email,phone,department,position,baseSalary,bankAccount,ifscCode,dateOfJoining';
const TEMPLATE_SAMPLE = `John,Doe,john.doe@example.com,9876543210,Engineering,Software Engineer,75000,123456789012,HDFC0001234,2024-01-15
Jane,Smith,jane.smith@example.com,9876543211,HR,HR Manager,65000,987654321098,SBIN0000001,2024-02-01`;

function parseCSV(text: string): Row[] {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });
}

function validateRow(row: Row): ValidationResult {
  const errors: string[] = [];
  if (!row.firstName?.trim()) errors.push('First name required');
  if (!row.email?.trim()) {
    errors.push('Email required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
    errors.push('Invalid email format');
  }
  const salary = parseFloat(row.baseSalary);
  if (!row.baseSalary?.trim()) {
    errors.push('Salary required');
  } else if (isNaN(salary) || salary <= 0) {
    errors.push('Salary must be a positive number');
  }
  return { row, valid: errors.length === 0, errors };
}

function downloadTemplate() {
  const content = `${TEMPLATE_HEADERS}\n${TEMPLATE_SAMPLE}`;
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'employee_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const STEPS = ['Upload', 'Preview', 'Result'];

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [validated, setValidated] = useState<ValidationResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState('');

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setValidated(parsed.map(validateRow));
      setStep(1);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    const validRows = validated.filter(v => v.valid).map(v => v.row);
    if (validRows.length === 0) return;
    setImporting(true);
    setImportError('');
    try {
      const res = await fetch('/api/import/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResult(data);
      setStep(2);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setStep(0);
    setFileName('');
    setRows([]);
    setValidated([]);
    setResult(null);
    setImportError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const validCount = validated.filter(v => v.valid).length;
  const invalidCount = validated.filter(v => !v.valid).length;
  const preview = validated.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Import Employees</h2>
        <p className="text-sm text-slate-500">Bulk import employee data from a CSV file</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              i < step
                ? 'bg-blue-100 text-blue-700'
                : i === step
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-400'
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step ? 'bg-blue-600 text-white' : i === step ? 'bg-white text-blue-600' : 'bg-slate-300 text-slate-500'
              }`}>
                {i < step ? '✓' : i + 1}
              </span>
              {label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 ${i < step ? 'bg-blue-400' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Upload */}
      {step === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-6">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-colors ${
              dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
              <Upload className="w-7 h-7 text-blue-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">Drag and drop your CSV file here</p>
              <p className="text-xs text-slate-400 mt-1">or click to browse</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
          </div>

          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-600">Expected CSV format</p>
            </div>
            <code className="text-xs text-slate-500 break-all block">
              {TEMPLATE_HEADERS}
            </code>
            <button
              onClick={e => { e.stopPropagation(); downloadTemplate(); }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2"
            >
              Download sample template
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Preview */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700">{fileName}</p>
                  <p className="text-xs text-slate-400">{rows.length} rows parsed</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  {validCount} valid
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1.5 text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    {invalidCount} invalid
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Preview — first {Math.min(10, rows.length)} rows
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['First Name', 'Last Name', 'Email', 'Department', 'Position', 'Salary', 'Status'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                    <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((v, i) => (
                    <tr
                      key={i}
                      className={`border-b border-slate-50 ${v.valid ? 'bg-white' : 'bg-red-50'}`}
                    >
                      <td className="px-3 py-2 text-slate-700">{v.row.firstName || <span className="text-red-400 italic">missing</span>}</td>
                      <td className="px-3 py-2 text-slate-600">{v.row.lastName}</td>
                      <td className="px-3 py-2 text-slate-600">{v.row.email || <span className="text-red-400 italic">missing</span>}</td>
                      <td className="px-3 py-2 text-slate-600">{v.row.department}</td>
                      <td className="px-3 py-2 text-slate-600">{v.row.position}</td>
                      <td className="px-3 py-2 text-slate-600">{v.row.baseSalary}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded-full font-medium ${v.valid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {v.valid ? 'Valid' : 'Invalid'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-red-500">{v.errors.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 10 && (
              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
                <p className="text-xs text-slate-400">+ {rows.length - 10} more rows not shown</p>
              </div>
            )}
          </div>

          {importError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{importError}</p>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? 'Importing...' : `Import ${validCount} Employee${validCount !== 1 ? 's' : ''}`}
              {!importing && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Result */}
      {step === 2 && result && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="flex flex-col items-center gap-4 text-center mb-8">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">Import Complete</p>
                <p className="text-sm text-slate-500 mt-1">Your employee data has been processed</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-emerald-600">{result.created}</p>
                <p className="text-sm text-emerald-700 mt-1 font-medium">Created</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-slate-500">{result.skipped}</p>
                <p className="text-sm text-slate-600 mt-1 font-medium">Skipped (duplicates)</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm font-semibold text-red-700">{result.errors.length} error{result.errors.length !== 1 ? 's' : ''}</p>
                </div>
                <ul className="space-y-1">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-xs text-red-600">{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Import More
            </button>
            <button
              onClick={() => router.push('/employees')}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Go to Employees
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
