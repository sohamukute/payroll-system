'use client';
import { useCallback, useEffect, useState } from 'react';
import { Employee, Salary, SalaryWithEmployee, CycleStatus } from '@/lib/types';
import { formatCurrency, getCurrentMonth, getStatusColor } from '@/lib/utils';
import { Play, CheckCircle, AlertCircle, Lock } from 'lucide-react';

interface ProcessResult {
  emp: Employee;
  status: 'ok' | 'skip' | 'error';
  message: string;
  salary?: Salary;
}

const CYCLE_NEXT: Record<CycleStatus, CycleStatus | null> = {
  DRAFT: 'PROCESSED',
  PROCESSED: 'PAID',
  PAID: 'LOCKED',
  LOCKED: null,
};

const CYCLE_ACTION_LABEL: Record<CycleStatus, string> = {
  DRAFT: 'Mark Processed',
  PROCESSED: 'Mark Paid',
  PAID: 'Lock',
  LOCKED: '',
};

export default function PayrollPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [alreadyProcessed, setAlreadyProcessed] = useState(0);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Cycle management state
  const [salaries, setSalaries] = useState<SalaryWithEmployee[]>([]);
  const [cycleError, setCycleError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [lockingAll, setLockingAll] = useState(false);

  const fetchSalaries = useCallback(async () => {
    setCycleError('');
    try {
      const res = await fetch(`/api/salary?month=${month}`);
      if (!res.ok) throw new Error('Failed to fetch salary list');
      const data: SalaryWithEmployee[] = await res.json();
      setSalaries(data);
    } catch (err: unknown) {
      setCycleError(err instanceof Error ? err.message : 'Error loading salaries');
    }
  }, [month]);

  async function fetchData() {
    setLoadError('');
    try {
      const [empRes, salRes] = await Promise.all([
        fetch('/api/employees'),
        fetch(`/api/salary?month=${month}`),
      ]);
      if (!empRes.ok) throw new Error('Failed to fetch employees');
      if (!salRes.ok) throw new Error('Failed to fetch salaries');
      const [empData, salData] = await Promise.all([empRes.json(), salRes.json()]);
      setEmployees(empData.filter((e: Employee) => e.status === 'ACTIVE'));
      setAlreadyProcessed(salData.length);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Error loading data');
    }
  }

  useEffect(() => {
    fetchData();
    fetchSalaries();
    setResults([]);
    setDone(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  async function handleProcess() {
    setProcessing(true);
    setResults([]);
    setDone(false);
    const out: ProcessResult[] = [];

    for (const emp of employees) {
      await new Promise(r => setTimeout(r, 100));
      try {
        const res = await fetch('/api/salary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: emp.id, month }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const msg = errData.message ?? errData.error ?? 'Error processing';
          out.push({ emp, status: 'error', message: msg });
        } else {
          const sal: Salary = await res.json();
          out.push({ emp, status: 'ok', message: `Net: ${formatCurrency(sal.netSalary)}`, salary: sal });
        }
      } catch (err: unknown) {
        out.push({ emp, status: 'error', message: err instanceof Error ? err.message : 'Error' });
      }
      setResults([...out]);
    }

    setProcessing(false);
    setDone(true);
    await fetchData();
    await fetchSalaries();
  }

  async function advanceCycleStatus(id: string, nextStatus: CycleStatus) {
    setUpdatingId(id);
    setCycleError('');
    try {
      const res = await fetch(`/api/salary/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleStatus: nextStatus }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? 'Failed to update status');
      }
      await fetchSalaries();
    } catch (err: unknown) {
      setCycleError(err instanceof Error ? err.message : 'Error updating status');
    } finally {
      setUpdatingId(null);
    }
  }

  async function lockAllPaid() {
    setLockingAll(true);
    setCycleError('');
    const paid = salaries.filter(s => s.cycleStatus === 'PAID');
    try {
      await Promise.all(
        paid.map(s =>
          fetch(`/api/salary/${s.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cycleStatus: 'LOCKED' }),
          })
        )
      );
      await fetchSalaries();
    } catch (err: unknown) {
      setCycleError(err instanceof Error ? err.message : 'Error locking salaries');
    } finally {
      setLockingAll(false);
    }
  }

  const processed = results.filter(r => r.status === 'ok');
  const totalPayroll = processed.reduce((s, r) => s + (r.salary?.netSalary ?? 0), 0);
  const paidCount = salaries.filter(s => s.cycleStatus === 'PAID').length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Process Payroll</h2>
        <p className="text-sm text-slate-500">Calculate salary for all employees in bulk</p>
      </div>

      {loadError && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{loadError}</div>}

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

      {/* ── Payroll Cycle Management ── */}
      {salaries.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Payroll Cycle Management</h3>
              <p className="text-xs text-slate-500 mt-0.5">Advance each salary through DRAFT → PROCESSED → PAID → LOCKED</p>
            </div>
            {paidCount > 0 && (
              <button
                onClick={lockAllPaid}
                disabled={lockingAll}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-xs rounded-lg hover:bg-slate-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                <Lock className="w-3.5 h-3.5" />
                {lockingAll ? 'Locking...' : `Lock All Paid (${paidCount})`}
              </button>
            )}
          </div>

          {cycleError && (
            <div className="px-5 py-2 bg-red-50 text-red-600 text-xs border-b border-red-100">{cycleError}</div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Net Salary</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {salaries.map(sal => {
                  const cycleStatus = sal.cycleStatus ?? 'DRAFT';
                  const next = CYCLE_NEXT[cycleStatus];
                  const isUpdating = updatingId === sal.id;
                  return (
                    <tr key={sal.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {sal.employee.firstName} {sal.employee.lastName}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{sal.employee.department}</td>
                      <td className="px-5 py-3 text-right font-medium text-slate-800">
                        {formatCurrency(sal.netSalary)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cycleStatus)}`}>
                          {cycleStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {next ? (
                          <button
                            onClick={() => advanceCycleStatus(sal.id, next)}
                            disabled={isUpdating || lockingAll}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            {isUpdating ? 'Saving...' : CYCLE_ACTION_LABEL[cycleStatus]}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <Lock className="w-3.5 h-3.5" />
                            Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
