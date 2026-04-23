'use client';
import { useEffect, useState } from 'react';
import { getEmployees, getSalariesForMonth, calculateAndSaveSalary, getAttendanceForMonth } from '@/lib/store';
import { Employee, Salary } from '@/lib/types';
import { formatCurrency, getCurrentMonth } from '@/lib/utils';
import { Play, CheckCircle, AlertCircle } from 'lucide-react';

interface ProcessResult {
  emp: Employee;
  status: 'ok' | 'skip' | 'error';
  message: string;
  salary?: Salary;
}

export default function PayrollPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setEmployees(getEmployees().filter(e => e.status === 'ACTIVE'));
    setResults([]);
    setDone(false);
  }, [month]);

  async function handleProcess() {
    setProcessing(true);
    setResults([]);
    setDone(false);
    const out: ProcessResult[] = [];

    for (const emp of employees) {
      await new Promise(r => setTimeout(r, 100));
      const att = getAttendanceForMonth(emp.id, month);
      if (att.length === 0) {
        out.push({ emp, status: 'skip', message: 'No attendance records' });
        setResults([...out]);
        continue;
      }
      try {
        const sal = calculateAndSaveSalary(emp, month);
        out.push({ emp, status: 'ok', message: `Net: ${formatCurrency(sal.netSalary)}`, salary: sal });
      } catch (err: unknown) {
        out.push({ emp, status: 'error', message: err instanceof Error ? err.message : 'Error' });
      }
      setResults([...out]);
    }

    setProcessing(false);
    setDone(true);
  }

  const processed = results.filter(r => r.status === 'ok');
  const totalPayroll = processed.reduce((s, r) => s + (r.salary?.netSalary ?? 0), 0);

  const salariesForMonth = getSalariesForMonth(month);
  const alreadyProcessed = salariesForMonth.length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Process Payroll</h2>
        <p className="text-sm text-slate-500">Calculate salary for all employees in bulk</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Select Month</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="block px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Active Employees</p>
            <p className="text-2xl font-bold text-slate-800">{employees.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Already Processed</p>
            <p className="text-2xl font-bold text-green-600">{alreadyProcessed}</p>
          </div>
          <button
            onClick={handleProcess}
            disabled={processing || employees.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            <Play className="w-4 h-4" />
            {processing ? 'Processing...' : 'Process Payroll'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Processing Results</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {results.map(r => (
              <div key={r.emp.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  {r.status === 'ok' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {r.status === 'skip' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                  {r.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.emp.firstName} {r.emp.lastName}</p>
                    <p className="text-xs text-slate-500">{r.emp.department}</p>
                  </div>
                </div>
                <span className={`text-sm ${
                  r.status === 'ok' ? 'text-green-600 font-medium' :
                  r.status === 'skip' ? 'text-yellow-600' : 'text-red-600'
                }`}>{r.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {done && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Summary — {month}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{processed.length}</p>
              <p className="text-xs text-slate-500">Processed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{results.filter(r => r.status === 'skip').length}</p>
              <p className="text-xs text-slate-500">Skipped</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPayroll)}</p>
              <p className="text-xs text-slate-500">Total Payroll</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
