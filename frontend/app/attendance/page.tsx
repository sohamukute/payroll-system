'use client';
import { useEffect, useState } from 'react';
import { getEmployees, getAttendanceForMonth, markAttendance } from '@/lib/store';
import { Employee, Attendance } from '@/lib/types';
import { getStatusColor, getDaysInMonth } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

const STATUSES = ['PRESENT', 'ABSENT', 'PAID_LEAVE', 'HALF_DAY', 'HOLIDAY'] as const;

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [month, setMonth] = useState('2026-04');
  const [selected, setSelected] = useState('');
  const [records, setRecords] = useState<Attendance[]>([]);
  const [status, setStatus] = useState<typeof STATUSES[number]>('PRESENT');
  const [date, setDate] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { setEmployees(getEmployees().filter(e => e.status === 'ACTIVE')); }, []);
  useEffect(() => {
    if (selected) setRecords(getAttendanceForMonth(selected, month));
  }, [selected, month]);

  function handleMark(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !date) { setMsg('Select employee and date'); return; }
    markAttendance({ employeeId: selected, date, status });
    setRecords(getAttendanceForMonth(selected, month));
    setMsg('Attendance marked!');
    setTimeout(() => setMsg(''), 2000);
  }

  const days = getDaysInMonth(month);
  const [y, m] = month.split('-').map(Number);
  const workDays = Array.from({ length: days }, (_, i) => {
    const d = new Date(y, m - 1, i + 1);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) return null;
    const ds = `${month}-${String(i + 1).padStart(2, '0')}`;
    return ds;
  }).filter(Boolean) as string[];

  const attMap: Record<string, Attendance> = {};
  for (const r of records) attMap[r.date] = r;

  const present = records.filter(r => r.status === 'PRESENT').length;
  const absent = records.filter(r => r.status === 'ABSENT').length;
  const leave = records.filter(r => r.status === 'PAID_LEAVE').length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Attendance</h2>
        <p className="text-sm text-slate-500">Mark and view employee attendance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Mark Attendance</h3>
          <form onSubmit={handleMark} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Month</label>
              <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Employee</label>
              <select value={selected} onChange={e => setSelected(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as typeof STATUSES[number])}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {msg && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {msg}</p>}
            <button type="submit"
              className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">
              Mark Attendance
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[['Present', present, 'green'], ['Absent', absent, 'red'], ['Leave', leave, 'blue']].map(([l, v, c]) => (
                  <div key={l as string} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <p className="text-2xl font-bold text-slate-800">{v}</p>
                    <p className="text-xs text-slate-500">{l}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Calendar — {month}</h3>
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (
                    <div key={d} className="text-center text-slate-400 font-medium pb-1">{d}</div>
                  ))}
                  {workDays.map(ds => {
                    const att = attMap[ds];
                    const day = parseInt(ds.split('-')[2]);
                    return (
                      <div key={ds}
                        className={`rounded-lg p-1 text-center text-xs ${
                          att ? getStatusColor(att.status) : 'bg-slate-50 text-slate-400'
                        }`}>
                        <p className="font-medium">{day}</p>
                        {att && <p className="text-[9px] truncate">{att.status.replace('_', ' ')}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
          {!selected && (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <p className="text-slate-400">Select an employee to view attendance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
