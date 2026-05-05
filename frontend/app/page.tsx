'use client';
import { useEffect, useState } from 'react';
import { Users, UserCheck, IndianRupee, ClipboardList } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { Employee, Salary } from '@/lib/types';
import { formatCurrency, getCurrentMonth } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const month = getCurrentMonth();

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

  const active = employees.filter(e => e.status === 'ACTIVE').length;
  const totalPayroll = salaries.reduce((s, x) => s + x.netSalary, 0);
  const recent = [...employees].reverse().slice(0, 5);

  const deptMap: Record<string, number> = {};
  for (const e of employees) {
    deptMap[e.department] = (deptMap[e.department] ?? 0) + 1;
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Loading...</div>;
  if (error) return <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">Overview for {month}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={employees.length} icon={Users} color="blue" />
        <StatCard title="Active Employees" value={active} icon={UserCheck} color="green" />
        <StatCard title="Processed This Month" value={salaries.length} icon={ClipboardList} color="purple" />
        <StatCard
          title="Total Payroll"
          value={salaries.length ? formatCurrency(totalPayroll) : '—'}
          icon={IndianRupee}
          color="orange"
          sub={salaries.length ? `${salaries.length} employees` : 'Not processed yet'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Recent Employees</h3>
            <Link href="/employees" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recent.length === 0 && (
              <p className="text-sm text-slate-500">No employees yet. <Link href="/employees" className="text-blue-600 hover:underline">Add one</Link></p>
            )}
            {recent.map(emp => (
              <div key={emp.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-800">{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs text-slate-500">{emp.department} · {emp.position}</p>
                </div>
                <span className="text-xs font-medium text-slate-700">{formatCurrency(emp.baseSalary)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Department Breakdown</h3>
          {Object.keys(deptMap).length === 0 && (
            <p className="text-sm text-slate-500">No data yet.</p>
          )}
          <div className="space-y-3">
            {Object.entries(deptMap).map(([dept, count]) => (
              <div key={dept}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{dept}</span>
                  <span className="text-slate-700 font-medium">{count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${(count / employees.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/employees"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">
          Add Employee
        </Link>
        <Link href="/payroll"
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 font-medium">
          Process Payroll
        </Link>
      </div>
    </div>
  );
}
