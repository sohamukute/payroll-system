'use client';
import { useEffect, useState } from 'react';
import { Employee } from '@/lib/types';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface Leave {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedAt: string;
  reviewedBy?: string;
  employee: { firstName: string; lastName: string; department: string };
}

const LEAVE_TYPES = [
  'Casual Leave',
  'Sick Leave',
  'Earned Leave',
  'Maternity Leave',
  'Comp Off',
];

const STATUS_FILTERS = ['All', 'PENDING', 'APPROVED', 'REJECTED'] as const;

function statusBadge(status: Leave['status']) {
  const map: Record<Leave['status'], string> = {
    PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
    APPROVED: 'bg-green-50 text-green-700 border border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border border-red-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function calcDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

export default function LeavePage() {
  const [tab, setTab] = useState<'requests' | 'apply'>('requests');
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]>('All');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  // Form state
  const [form, setForm] = useState({
    employeeId: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    days: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  async function loadLeaves() {
    setLoading(true);
    try {
      const res = await fetch('/api/leaves');
      if (!res.ok) throw new Error('Failed to fetch leaves');
      setLeaves(await res.json());
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Error loading leaves', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployees() {
    try {
      const res = await fetch('/api/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data: Employee[] = await res.json();
      setEmployees(data.filter(e => e.status === 'ACTIVE'));
    } catch {
      // non-fatal
    }
  }

  useEffect(() => {
    loadLeaves();
    loadEmployees();
  }, []);

  function showMsg(text: string, type: 'success' | 'error' = 'success') {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleAction(leave: Leave, status: 'APPROVED' | 'REJECTED') {
    try {
      const res = await fetch(`/api/leaves/${leave.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update leave');
      await loadLeaves();
      showMsg(`Leave ${status.toLowerCase()} for ${leave.employee.firstName} ${leave.employee.lastName}`);
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Error updating leave', 'error');
    }
  }

  function handleFormChange(field: keyof typeof form, value: string) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'startDate' || field === 'endDate') {
        const d = calcDays(
          field === 'startDate' ? value : prev.startDate,
          field === 'endDate' ? value : prev.endDate,
        );
        next.days = d > 0 ? String(d) : '';
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId || !form.leaveType || !form.startDate || !form.endDate || !form.days || !form.reason) {
      showMsg('All fields are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, days: Number(form.days) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to apply leave');
      }
      setForm({ employeeId: '', leaveType: '', startDate: '', endDate: '', days: '', reason: '' });
      await loadLeaves();
      setTab('requests');
      showMsg('Leave application submitted successfully');
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Error submitting leave', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = statusFilter === 'All' ? leaves : leaves.filter(l => l.status === statusFilter);

  const counts = {
    PENDING: leaves.filter(l => l.status === 'PENDING').length,
    APPROVED: leaves.filter(l => l.status === 'APPROVED').length,
    REJECTED: leaves.filter(l => l.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Leave Management</h2>
          <p className="text-sm text-slate-500">Manage employee leave requests</p>
        </div>
        <button
          onClick={() => setTab('apply')}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Apply Leave
        </button>
      </div>

      {/* Message banner */}
      {msg && (
        <div className={`text-sm px-4 py-2 rounded-lg ${
          msgType === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {msg}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', count: counts.PENDING, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Approved', count: counts.APPROVED, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Rejected', count: counts.REJECTED, icon: XCircle, color: 'text-red-600 bg-red-50' },
        ].map(({ label, count, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{count}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['requests', 'apply'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'requests' ? 'Leave Requests' : 'Apply Leave'}
          </button>
        ))}
      </div>

      {/* Leave Requests Tab */}
      {tab === 'requests' && (
        <div className="space-y-4">
          {/* Status filter */}
          <div className="flex gap-2">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  statusFilter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f === 'All' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                {f !== 'All' && (
                  <span className="ml-1 opacity-75">({counts[f as keyof typeof counts]})</span>
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading...</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Employee', 'Leave Type', 'Start', 'End', 'Days', 'Reason', 'Status', 'Actions'].map(h => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400">
                        No leave requests found
                      </td>
                    </tr>
                  )}
                  {filtered.map(leave => (
                    <tr key={leave.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">
                          {leave.employee.firstName} {leave.employee.lastName}
                        </p>
                        <p className="text-xs text-slate-400">{leave.employee.department}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{leave.leaveType}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(leave.startDate)}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(leave.endDate)}</td>
                      <td className="px-4 py-3 text-center font-medium text-slate-700">{leave.days}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[180px]">
                        <p className="truncate" title={leave.reason}>{leave.reason}</p>
                      </td>
                      <td className="px-4 py-3">{statusBadge(leave.status)}</td>
                      <td className="px-4 py-3">
                        {leave.status === 'PENDING' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAction(leave, 'APPROVED')}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleAction(leave, 'REJECTED')}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
                            >
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {leave.reviewedBy ? `by ${leave.reviewedBy}` : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Apply Leave Tab */}
      {tab === 'apply' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-5">Leave Application Form</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              {/* Employee */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">Employee</label>
                <select
                  value={form.employeeId}
                  onChange={e => handleFormChange('employeeId', e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">Select employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} — {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              {/* Leave Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">Leave Type</label>
                <select
                  value={form.leaveType}
                  onChange={e => handleFormChange('leaveType', e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">Select type</option>
                  {LEAVE_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => handleFormChange('startDate', e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* End Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={e => handleFormChange('endDate', e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Days */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Days
                  <span className="ml-1 text-slate-400 font-normal">(auto-calculated)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.days}
                  onChange={e => handleFormChange('days', e.target.value)}
                  placeholder="0"
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-600">Reason</label>
              <textarea
                value={form.reason}
                onChange={e => handleFormChange('reason', e.target.value)}
                rows={3}
                placeholder="Provide reason for leave..."
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm({ employeeId: '', leaveType: '', startDate: '', endDate: '', days: '', reason: '' });
                  setTab('requests');
                }}
                className="px-5 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
