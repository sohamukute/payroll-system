'use client';
import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [empRes, salRes] = await Promise.all([
          fetch('/api/employees'),
          fetch(`/api/salary?month=${month}`),
        ]);
        if (!empRes.ok) throw new Error('Failed to fetch employees');
        if (!salRes.ok) throw new Error('Failed to fetch salaries');
        const [empData, salData] = await Promise.all([empRes.json(), salRes.json()]);
        setEmployees(empData);
        setSalaries(salData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Loading...</div>;
  if (error) return <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>;

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
          <h3 className="text-sm font-semibold text-slate-800">Salary Summary by Employee</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Employee</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Gross</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Deductions</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Net Pay</th>
            </tr>
          </thead>
          <tbody>
            {salaries.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-slate-400">No salary data for this month</td></tr>
            )}
            {salaries.map(sal => {
              const emp = employees.find(e => e.id === sal.employeeId);
              return (
                <tr key={sal.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {emp ? `${emp.firstName} ${emp.lastName}` : sal.employeeId}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(sal.totalEarnings)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(sal.totalDeductions)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(sal.netSalary)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
