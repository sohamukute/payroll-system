'use client';
import { useEffect, useState } from 'react';
import { getEmployees, getSalariesForMonth, getAttendanceForMonth } from '@/lib/store';
import { Salary, Employee } from '@/lib/types';
import { formatCurrency, getCurrentMonth } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#0891b2', '#be185d'];

export default function ReportsPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);

  useEffect(() => {
    setEmployees(getEmployees());
    setSalaries(getSalariesForMonth(month));
  }, [month]);

  const deptSalary: Record<string, number> = {};
  const deptCount: Record<string, number> = {};

  for (const emp of employees) {
    const sal = salaries.find(s => s.employeeId === emp.id);
    if (!deptSalary[emp.department]) { deptSalary[emp.department] = 0; deptCount[emp.department] = 0; }
    if (sal) deptSalary[emp.department] += sal.netSalary;
    deptCount[emp.department] = (deptCount[emp.department] ?? 0) + 1;
  }

  const deptBarData = Object.entries(deptSalary).map(([dept, total]) => ({
    dept, total: Math.round(total),
  }));

  const deptPieData = Object.entries(deptCount).map(([name, value]) => ({ name, value }));

  const totalGross = salaries.reduce((s, x) => s + x.totalEarnings, 0);
  const totalDeductions = salaries.reduce((s, x) => s + x.totalDeductions, 0);
  const totalNet = salaries.reduce((s, x) => s + x.netSalary, 0);
  const totalPF = salaries.reduce((s, x) => s + x.providentFund, 0);
  const totalTax = salaries.reduce((s, x) => s + x.incomeTax, 0);

  const attStats = employees.slice(0, 5).map(emp => {
    const att = getAttendanceForMonth(emp.id, month);
    const present = att.filter(a => a.status === 'PRESENT').length;
    const total = att.length;
    return { name: emp.firstName, present, total, pct: total ? Math.round((present / total) * 100) : 0 };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Reports</h2>
          <p className="text-sm text-slate-500">Payroll analytics and summaries</p>
        </div>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Total Gross', totalGross, 'text-blue-600'],
          ['Total Deductions', totalDeductions, 'text-red-600'],
          ['Total Net Payroll', totalNet, 'text-green-600'],
          ['PF Collected', totalPF, 'text-purple-600'],
        ].map(([label, val, cls]) => (
          <div key={label as string} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-lg font-bold ${cls}`}>{formatCurrency(val as number)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Department-wise Payroll</h3>
          {deptBarData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No salary data for this month</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptBarData} margin={{ top: 4, right: 4, left: 10, bottom: 4 }}>
                <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Employee Distribution by Department</h3>
          {deptPieData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={deptPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {deptPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Attendance Summary</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Employee</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Present</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total Days</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {attStats.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-slate-400">No attendance data</td></tr>
            )}
            {attStats.map(a => (
              <tr key={a.name} className="border-b border-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{a.name}</td>
                <td className="px-4 py-3 text-center">{a.present}</td>
                <td className="px-4 py-3 text-center">{a.total}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div className="h-1.5 bg-green-500 rounded-full" style={{ width: `${a.pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-600">{a.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
