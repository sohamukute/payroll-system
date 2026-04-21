'use client';
import { useEffect, useState } from 'react';
import { getEmployees, getSalariesForMonth, calculateAndSaveSalary, getSalaryForMonth } from '@/lib/store';
import { Employee, Salary } from '@/lib/types';
import { formatCurrency, getStatusColor, getCurrentMonth } from '@/lib/utils';
import Modal from '@/components/Modal';
import { FileText, Calculator } from 'lucide-react';

export default function SalaryPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [viewSalary, setViewSalary] = useState<{ emp: Employee; sal: Salary } | null>(null);
  const [msg, setMsg] = useState('');

  function reload() {
    setEmployees(getEmployees().filter(e => e.status === 'ACTIVE'));
    setSalaries(getSalariesForMonth(month));
  }

  useEffect(() => { reload(); }, [month]);

  function salaryFor(empId: string) {
    return salaries.find(s => s.employeeId === empId);
  }

  function handleCalculate(emp: Employee) {
    try {
      calculateAndSaveSalary(emp, month);
      reload();
      setMsg(`Salary calculated for ${emp.firstName} ${emp.lastName}`);
      setTimeout(() => setMsg(''), 2500);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Error calculating salary');
    }
  }

  function handleView(emp: Employee) {
    const sal = getSalaryForMonth(emp.id, month);
    if (sal) setViewSalary({ emp, sal });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Salary</h2>
          <p className="text-sm text-slate-500">Calculate and view employee salaries</p>
        </div>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {msg && <div className="bg-blue-50 text-blue-700 text-sm px-4 py-2 rounded-lg">{msg}</div>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employee</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Gross</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Deductions</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Net Pay</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400">No active employees</td></tr>
            )}
            {employees.map(emp => {
              const sal = salaryFor(emp.id);
              return (
                <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-slate-400">{emp.id}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{emp.department}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{sal ? formatCurrency(sal.totalEarnings) : '—'}</td>
                  <td className="px-4 py-3 text-right text-red-600">{sal ? formatCurrency(sal.totalDeductions) : '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{sal ? formatCurrency(sal.netSalary) : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {sal ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sal.status)}`}>{sal.status}</span>
                    ) : (
                      <span className="text-xs text-slate-400">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => handleCalculate(emp)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                        <Calculator className="w-3 h-3" /> Calculate
                      </button>
                      {sal && (
                        <button onClick={() => handleView(emp)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100">
                          <FileText className="w-3 h-3" /> Payslip
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viewSalary && (
        <Modal open={true} onClose={() => setViewSalary(null)} title="Payslip" width="max-w-2xl">
          <Payslip emp={viewSalary.emp} sal={viewSalary.sal} />
        </Modal>
      )}
    </div>
  );
}

function Payslip({ emp, sal }: { emp: Employee; sal: Salary }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
        <div>
          <p className="text-xs text-slate-500">Employee</p>
          <p className="font-semibold">{emp.firstName} {emp.lastName}</p>
          <p className="text-xs text-slate-500">{emp.id}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Department</p>
          <p className="font-medium">{emp.department}</p>
          <p className="text-xs text-slate-500">{emp.position}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Month</p>
          <p className="font-medium">{sal.month}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Days Worked</p>
          <p className="font-medium">{sal.presentDays} present / {sal.paidLeaveDays} leave / {sal.absentDays} absent</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Earnings</p>
          {[
            ['Basic Salary', sal.basicSalary],
            ['House Rent Allowance', sal.hra],
            ['Dearness Allowance', sal.da],
            ['Special Allowance', sal.specialAllowance],
          ].map(([label, val]) => (
            <div key={label as string} className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">{label}</span>
              <span className="font-medium">{formatCurrency(val as number)}</span>
            </div>
          ))}
          <div className="flex justify-between py-2 font-semibold">
            <span>Total Earnings</span>
            <span className="text-green-600">{formatCurrency(sal.totalEarnings)}</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Deductions</p>
          {[
            ['Provident Fund', sal.providentFund],
            ['ESI', sal.esi],
            ['Income Tax', sal.incomeTax],
            ['Professional Tax', sal.professionalTax],
          ].map(([label, val]) => (
            <div key={label as string} className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">{label}</span>
              <span className="font-medium">{formatCurrency(val as number)}</span>
            </div>
          ))}
          <div className="flex justify-between py-2 font-semibold">
            <span>Total Deductions</span>
            <span className="text-red-600">{formatCurrency(sal.totalDeductions)}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
        <span className="font-semibold text-slate-800">Net Salary Payable</span>
        <span className="text-xl font-bold text-blue-600">{formatCurrency(sal.netSalary)}</span>
      </div>
    </div>
  );
}
