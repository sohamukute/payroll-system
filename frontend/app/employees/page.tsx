'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { Employee } from '@/lib/types';
import { formatCurrency, getStatusColor } from '@/lib/utils';

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '',
  department: '', position: '', baseSalary: '', bankAccount: '',
  ifscCode: 'SBIN0000001', dateOfJoining: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');

  async function reload() {
    try {
      const res = await fetch('/api/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      setEmployees(data);
    } catch (err: unknown) {
      setPageError(err instanceof Error ? err.message : 'Error loading employees');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  const depts = Array.from(new Set(employees.map(e => e.department)));

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchName = `${e.firstName} ${e.lastName}`.toLowerCase().includes(q);
    const matchDept = !dept || e.department === dept;
    return matchName && matchDept;
  });

  function openAdd() { setForm(emptyForm); setEditing(null); setError(''); setShowAdd(true); }
  function openEdit(emp: Employee) {
    setForm({
      firstName: emp.firstName, lastName: emp.lastName, email: emp.email, phone: emp.phone,
      department: emp.department, position: emp.position, baseSalary: String(emp.baseSalary),
      bankAccount: emp.bankAccount, ifscCode: emp.ifscCode ?? 'SBIN0000001',
      dateOfJoining: emp.dateOfJoining, status: emp.status,
    });
    setEditing(emp); setError(''); setShowAdd(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.firstName || !form.email || !form.baseSalary) {
      setError('Name, email and salary are required.');
      return;
    }
    const salary = parseFloat(form.baseSalary);
    if (isNaN(salary) || salary <= 0) { setError('Invalid salary.'); return; }
    setSubmitting(true);
    try {
      const data = { ...form, baseSalary: salary };
      let res: Response;
      if (editing) {
        res = await fetch(`/api/employees/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...editing, ...data }),
        });
      } else {
        res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message ?? errData.error ?? 'Error saving employee');
      }
      await reload();
      setShowAdd(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving employee');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deactivate this employee?')) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to deactivate employee');
      await reload();
    } catch (err: unknown) {
      setPageError(err instanceof Error ? err.message : 'Error deleting employee');
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Loading...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Employees</h2>
          <p className="text-sm text-slate-500">{employees.length} total</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {pageError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{pageError}</p>}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={dept} onChange={e => setDept(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Departments</option>
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Position</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Salary</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400">No employees found</td></tr>
            )}
            {filtered.map(emp => (
              <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{emp.id}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs text-slate-400">{emp.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{emp.department}</td>
                <td className="px-4 py-3 text-slate-600">{emp.position}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(emp.baseSalary)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(emp.status)}`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => openEdit(emp)} className="p-1 text-slate-400 hover:text-blue-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(emp.id)} className="p-1 text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editing ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            {([
              ['First Name', 'firstName'], ['Last Name', 'lastName'],
            ] as [string, keyof typeof form][]).map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
          </div>
          {([
            ['Email', 'email', 'email'], ['Phone', 'phone', 'tel'],
            ['Department', 'department', 'text'], ['Position', 'position', 'text'],
            ['Base Salary', 'baseSalary', 'number'], ['Bank Account', 'bankAccount', 'text'],
            ['IFSC Code', 'ifscCode', 'text'],
            ['Date of Joining', 'dateOfJoining', 'date'],
          ] as [string, keyof typeof form, string][]).map(([label, key, type]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
              {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
